import { useWatchTimeTracking } from '@app/hooks/useWatchTimeTracking';
import { logger } from '@app/utils/logger';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { InteractionManager, StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
import type { WebViewMessageEvent } from 'react-native-webview';

import { ControlsOverlay } from './ControlsOverlay';
import { StreamPlayerPoster } from './StreamPlayerPoster';
import { StreamPlayerWebView } from './StreamPlayerWebView';
import {
  ControlsTriggerButton,
  DebugErrorOverlay,
  TouchBlockOverlay,
} from './StreamPlayerOverlays';
import {
  buildRawTwitchPlayerUrl,
  buildTwitchAutoplayEnsureScript,
  buildTwitchCaptionHiderScript,
  buildTwitchClipPlayerUrl,
  buildTwitchContentGateAcceptScript,
  buildTwitchOverlayHideScript,
  buildTwitchPlayerAudioDefaultScript,
  buildTwitchPlayerQualityDefaultScript,
} from './twitchPlayerSource';
import type { StreamPlayerProps } from './types';
import { usePlayerBridge } from './usePlayerBridge';
import { useStreamPlayerControls } from './useStreamPlayerControls';

export type { StreamInfo, StreamPlayerProps, StreamPlayerRef } from './types';

const TWITCH_AUTH_HELPER_SCRIPT = `
(() => {
  const post = type => {
    try {
      window.ReactNativeWebView?.postMessage(JSON.stringify({ type }));
    } catch {}
  };

  window.open = url => {
    if (typeof url === 'string' && url.length > 0) {
      window.location.assign(url);
    }
    return window;
  };

  let postedAuthComplete = false;
  const detectAuthComplete = () => {
    if (postedAuthComplete || !document.body) {
      return;
    }

    const text = document.body.textContent?.toLowerCase() ?? '';
    if (
      (text.includes("you're logged in") || text.includes("you’re logged in")) &&
      text.includes('refresh the page')
    ) {
      postedAuthComplete = true;
      post('twitchAuthComplete');
    }
  };

  detectAuthComplete();
  new MutationObserver(detectAuthComplete).observe(document.documentElement, {
    childList: true,
    subtree: true});
})();
true;
`;

// Polls the VOD <video> element's position and reports it to native so the
// last-known offset survives a WebView reload. The stock player owns the
// scrubber; we only observe, so this never fights the user's own seeks.
const VOD_PROGRESS_TRACKER_SCRIPT = `
(() => {
  if (window.__foamVodProgressInstalled) {
    return;
  }
  window.__foamVodProgressInstalled = true;

  setInterval(() => {
    try {
      const video = document.querySelector('video');
      const time = video ? video.currentTime : 0;
      if (Number.isFinite(time) && time > 0) {
        window.ReactNativeWebView?.postMessage(
          JSON.stringify({ type: 'vodProgress', payload: { currentTime: time } }),
        );
      }
    } catch {}
  }, 3000);
})();
true;
`;

// The unscripted live player gives no 'playing' bridge event, so the poster is
// dismissed off WebView load-end. Linger briefly past that so the first decoded
// frame is already on screen before the loading frame fades away.
const POSTER_HIDE_DELAY_MS = 450;
// Never strand the poster over the player if the page errors before load-end.
const POSTER_SAFETY_TIMEOUT_MS = 9000;

export const StreamPlayer = memo(function StreamPlayer({
  autoplay = true,
  channel,
  clip,
  deferOverlayUntilUserUnmute = false,
  height,
  muted: initialMuted = false,
  onBackPress,
  onContentGateChange,
  onEnded,
  onError,
  onOffline,
  onOnline,
  onPause,
  onPlaybackLatencyChange,
  onPlay,
  onReady,
  onRefresh,
  onSharePress,
  onVideoAreaPress,
  onVideoAreaSwipeDown,
  onWebViewLoaded,
  parent = 'www.twitch.tv',
  posterUrl,
  showOverlayControls = false,
  streamInfo,
  video,
  width,
  ref,
}: StreamPlayerProps) {
  const webViewRef = useRef<WebView>(null);
  const needsInitRef = useRef(true);
  const authCompletionReloadTimeoutRef = useRef<ReturnType<
    typeof setTimeout
  > | null>(null);
  const [webViewKey, setWebViewKey] = useState(0);
  const [lastHttpError, setLastHttpError] = useState<{
    url: string;
    statusCode: number;
  } | null>(null);
  // Mounting the WebView while the screen-push animation is still running
  // makes WKWebView start the inline video mid-transition; its AVPlayer
  // layer then intermittently never attaches to the compositor (audio and
  // currentTime advance but the picture is black or frozen on one frame).
  // Wait for interactions/transitions to settle before creating the WebView.
  const [canMountWebView, setCanMountWebView] = useState(false);
  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      setCanMountWebView(true);
    });
    return () => task.cancel();
  }, []);

  // Even when mounted post-transition, WKWebView sometimes fails to attach
  // the inline video's AVPlayer layer to the compositor (picture stays black
  // or frozen while playback advances). The page cannot observe this, so we
  // unconditionally force a frame change shortly after playback starts —
  // resizing the WKWebView makes it rebuild its layer tree and pick the
  // video layer up.
  // With the unscripted player there is no bridge 'playing' event, so the
  // nudge fires off WebView load-end; autoplay starts shortly after, which
  // the second pulse at +2.5s covers.
  const [layoutNudge, setLayoutNudge] = useState(0);
  const nudgeTimeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const nudgePlayedRef = useRef(false);
  // Loading frame shown over the WebView (stream thumbnail + spinner) until the
  // player has actually started, replacing the black box during page load.
  const [isPlayerLoading, setIsPlayerLoading] = useState(true);
  const posterHideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const handleBridgePlaying = useCallback(() => {
    if (nudgePlayedRef.current) {
      return;
    }
    nudgePlayedRef.current = true;
    if (!posterHideTimeoutRef.current) {
      posterHideTimeoutRef.current = setTimeout(() => {
        posterHideTimeoutRef.current = null;
        setIsPlayerLoading(false);
      }, POSTER_HIDE_DELAY_MS);
    }
    const pulse = (delay: number) => {
      nudgeTimeoutsRef.current.push(
        setTimeout(() => setLayoutNudge(1), delay),
        setTimeout(() => setLayoutNudge(0), delay + 120),
      );
    };
    pulse(0);
    pulse(2500);
  }, []);
  useEffect(() => {
    const timeoutsRef = nudgeTimeoutsRef;
    const posterTimeoutRef = posterHideTimeoutRef;
    return () => {
      timeoutsRef.current.forEach(clearTimeout);
      if (posterTimeoutRef.current) {
        clearTimeout(posterTimeoutRef.current);
      }
    };
  }, []);

  const sourceKey = `${channel ?? ''}|${clip ?? ''}|${video ?? ''}|${parent}|${autoplay}|${initialMuted}|${deferOverlayUntilUserUnmute}`;

  // Last reported VOD playback offset (seconds). Survives a WebView remount so
  // the embed can resume instead of restarting at 0:00; reset per source.
  const resumeTimeRef = useRef(0);

  useWatchTimeTracking();

  useEffect(() => {
    needsInitRef.current = true;
    nudgePlayedRef.current = false;
    resumeTimeRef.current = 0;
    setIsPlayerLoading(true);
  }, [sourceKey]);

  // Re-show the loading frame for each WebView generation and arm a safety
  // dismissal so a load that never finishes can't trap it over the player.
  useEffect(() => {
    const timeout = setTimeout(
      () => setIsPlayerLoading(false),
      POSTER_SAFETY_TIMEOUT_MS,
    );
    return () => clearTimeout(timeout);
  }, [sourceKey, webViewKey]);

  const remountEmbedWebView = useCallback(() => {
    logger.main.info('webview remounted', {
      name: 'twitch_player_info',
      channel,
    });
    needsInitRef.current = true;
    nudgePlayedRef.current = false;
    if (posterHideTimeoutRef.current) {
      clearTimeout(posterHideTimeoutRef.current);
      posterHideTimeoutRef.current = null;
    }
    setIsPlayerLoading(true);
    setWebViewKey(key => key + 1);
  }, [channel]);

  const scheduleAuthCompletionReload = useCallback(() => {
    if (authCompletionReloadTimeoutRef.current) {
      return;
    }

    authCompletionReloadTimeoutRef.current = setTimeout(() => {
      authCompletionReloadTimeoutRef.current = null;
      remountEmbedWebView();
    }, 750);
  }, [remountEmbedWebView]);

  useEffect(() => {
    const timeoutRef = authCompletionReloadTimeoutRef;
    return () => {
      const timeoutId = timeoutRef.current;
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutRef.current = null;
      }
    };
  }, []);

  const runJavaScript = (script: string) => {
    webViewRef.current?.injectJavaScript(script);
  };

  const {
    handleMessage,
    hasContentGate,
    overlayUnlocked,
    pause,
    play,
    playbackLatencySeconds,
    playerState,
    playerStatus,
    resetPlayerStatus,
  } = usePlayerBridge({
    autoplay,
    channel,
    deferOverlayUntilUserUnmute,
    forceRefresh: remountEmbedWebView,
    initialMuted,
    onContentGateChange,
    onEnded,
    onError,
    onOffline,
    onOnline,
    onPause,
    onPlaybackLatencyChange,
    onPlay: () => {
      handleBridgePlaying();
      onPlay?.();
    },
    onReady,
    ref,
    runJavaScript,
    scheduleAuthCompletionReload,
    sourceKey,
    webViewKey,
  });

  const channelName = channel || 'twitch';
  // Memoised so the URL only changes when the source or a remount (webViewKey)
  // does — never on an incidental re-render (e.g. the layout nudge), which
  // would otherwise reload the WebView. On remount it reads the latest
  // resume offset so a VOD picks up where it left off.
  const webViewSource = useMemo(
    () =>
      clip
        ? {
            uri: buildTwitchClipPlayerUrl({
              clip,
              parent,
              autoplay,
              muted: initialMuted,
            }),
          }
        : {
            uri: buildRawTwitchPlayerUrl({
              channel: channelName,
              video,
              parent,
              autoplay,
              muted: initialMuted,
              timeSeconds: video ? resumeTimeRef.current : undefined,
            }),
          },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [clip, channelName, video, parent, autoplay, initialMuted, webViewKey],
  );

  // The stock player.twitch.tv page runs unscripted: Twitch's own UI handles
  // playback, so the playerControls bootstrap is not injected and the bridge
  // (ready/playing/pause messages, native controls overlay) stays dormant.
  // We auto-accept the mature-content gate, hide the text track ('hidden', not
  // 'disabled', which would stall WKWebView's native HLS AVPlayer), and — when
  // autoplaying — nudge the video into unmuted playback since Twitch's embed
  // otherwise tends to land paused/muted. The player's own chrome is hidden
  // only when foam is drawing its own overlay controls over the video.
  const injectedJavaScript =
    TWITCH_AUTH_HELPER_SCRIPT +
    '\n' +
    buildTwitchContentGateAcceptScript() +
    '\n' +
    buildTwitchCaptionHiderScript() +
    (autoplay && !clip
      ? '\n' + buildTwitchAutoplayEnsureScript({ muted: initialMuted })
      : '') +
    (showOverlayControls && !clip
      ? '\n' + buildTwitchOverlayHideScript()
      : '') +
    (video ? '\n' + VOD_PROGRESS_TRACKER_SCRIPT : '');

  // The tracker posts unsolicited `vodProgress` messages; capture those for
  // resume-on-reload and forward everything else to the player bridge.
  const handleWebViewMessage = useCallback(
    (event: WebViewMessageEvent) => {
      try {
        const message = JSON.parse(event.nativeEvent.data) as {
          type?: string;
          payload?: { currentTime?: number };
        };
        if (message.type === 'vodProgress') {
          const time = message.payload?.currentTime;
          if (typeof time === 'number' && Number.isFinite(time)) {
            resumeTimeRef.current = time;
          }
          return;
        }
      } catch {
        // Fall through to the bridge for non-JSON / unexpected payloads.
      }
      handleMessage(event);
    },
    [handleMessage],
  );

  const injectedJavaScriptBeforeContentLoaded = clip
    ? TWITCH_AUTH_HELPER_SCRIPT
    : buildTwitchPlayerQualityDefaultScript({
        defaultQuality: '720p60',
        maxBitrateBps: 3_500_000,
      }) +
      '\n' +
      buildTwitchPlayerAudioDefaultScript({ muted: initialMuted });

  const handleWebViewHttpError = useCallback(
    (error: { statusCode: number; url: string }) => {
      setLastHttpError(error);
    },
    [],
  );

  const { controlsVisible, handlePlayPause, toggleControls, videoTapGesture } =
    useStreamPlayerControls({
      onVideoAreaPress,
      onVideoAreaSwipeDown,
      pause,
      play,
      playerIsPaused: playerState.isPaused,
    });

  const handleRefresh = useCallback(() => {
    resetPlayerStatus();
    onRefresh?.();
  }, [onRefresh, resetPlayerStatus]);

  const playerWidth = width ?? '100%';
  const playerHeight = height ?? '100%';
  const allowsTwitchInteraction =
    Boolean(clip) || !showOverlayControls || hasContentGate;
  const shouldShowNativeControls =
    showOverlayControls &&
    !clip &&
    !allowsTwitchInteraction &&
    playerStatus.isReady &&
    (!deferOverlayUntilUserUnmute || overlayUnlocked);

  return (
    <View
      collapsable={false}
      style={[
        styles.container,
        { width: playerWidth, height: playerHeight },
        layoutNudge !== 0 && { paddingBottom: layoutNudge },
        hasContentGate && styles.containerScrollable,
      ]}
    >
      {canMountWebView ? (
        <StreamPlayerWebView
          allowsTwitchInteraction={allowsTwitchInteraction}
          channel={channel}
          clip={clip}
          injectedJavaScript={injectedJavaScript}
          injectedJavaScriptBeforeContentLoaded={
            injectedJavaScriptBeforeContentLoaded
          }
          needsInitRef={needsInitRef}
          onError={onError}
          onHttpError={handleWebViewHttpError}
          onMessage={handleWebViewMessage}
          onWebViewLoaded={() => {
            handleBridgePlaying();
            onWebViewLoaded?.();
          }}
          remountWebView={remountEmbedWebView}
          scheduleAuthCompletionReload={scheduleAuthCompletionReload}
          source={webViewSource}
          video={video}
          webViewKey={webViewKey}
          webViewRef={webViewRef}
        />
      ) : null}

      <StreamPlayerPoster posterUrl={posterUrl} visible={isPlayerLoading} />

      {shouldShowNativeControls && (
        <TouchBlockOverlay gesture={videoTapGesture} />
      )}

      {__DEV__ && lastHttpError && (
        <DebugErrorOverlay
          error={lastHttpError}
          onDismiss={() => setLastHttpError(null)}
        />
      )}

      {shouldShowNativeControls && (
        <ControlsTriggerButton onPress={toggleControls} />
      )}

      {shouldShowNativeControls && (
        <ControlsOverlay
          isVisible={controlsVisible}
          latencySeconds={playbackLatencySeconds}
          onBackPress={onBackPress}
          onPipPress={() => {}}
          onPlayPausePress={handlePlayPause}
          onRefresh={onRefresh ? handleRefresh : undefined}
          onSharePress={onSharePress}
          onToggleControls={toggleControls}
          paused={playerState.isPaused}
          streamInfo={streamInfo}
        />
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#000',
    overflow: 'hidden',
    position: 'relative',
  },
  containerScrollable: {
    overflow: 'visible',
  },
});
