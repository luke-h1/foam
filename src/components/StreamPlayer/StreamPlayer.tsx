import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { InteractionManager, Platform, StyleSheet, View } from 'react-native';
import type { WebViewMessageEvent } from 'react-native-webview';
import { WebView } from 'react-native-webview';

import { useWatchTimeTracking } from '@app/hooks/useWatchTimeTracking';
import { usePreference } from '@app/store/preferenceStore';
import { theme } from '@app/styles/themes';
import { logger } from '@app/utils/logger';

import { Image } from '../Image/Image';
import { ControlsOverlay } from './ControlsOverlay';
import { PIP_ENABLED } from './pipFeature';
import { PLAYER_LOAD_TIMEOUT_MS } from './playerTelemetry';
import { DebugErrorOverlay, TouchBlockOverlay } from './StreamPlayerOverlays';
import { StreamPlayerPoster } from './StreamPlayerPoster';
import { StreamPlayerWebView } from './StreamPlayerWebView';
import { buildRawTwitchPlayerUrl } from './twitchPlayerSource/buildRawTwitchPlayerUrl';
import { buildTwitchAutoplayEnsureScript } from './twitchPlayerSource/buildTwitchAutoplayEnsureScript';
import { buildTwitchCaptionHiderScript } from './twitchPlayerSource/buildTwitchCaptionHiderScript';
import { buildTwitchChromeHiderScript } from './twitchPlayerSource/buildTwitchChromeHiderScript';
import { buildTwitchClipPlayerUrl } from './twitchPlayerSource/buildTwitchClipPlayerUrl';
import { buildTwitchContentGateAcceptScript } from './twitchPlayerSource/buildTwitchContentGateAcceptScript';
import { buildTwitchContentGateWatcherScript } from './twitchPlayerSource/buildTwitchContentGateWatcherScript';
import { buildTwitchEmbedErrorWatcherScript } from './twitchPlayerSource/buildTwitchEmbedErrorWatcherScript';
import { buildTwitchLatencyTrackerScript } from './twitchPlayerSource/buildTwitchLatencyTrackerScript';
import { buildTwitchLiveSyncScript } from './twitchPlayerSource/buildTwitchLiveSyncScript';
import { buildTwitchPipBridgeScript } from './twitchPlayerSource/buildTwitchPipBridgeScript';
import { buildTwitchPlayerAudioDefaultScript } from './twitchPlayerSource/buildTwitchPlayerAudioDefaultScript';
import { buildTwitchPlayerQualityDefaultScript } from './twitchPlayerSource/buildTwitchPlayerQualityDefaultScript';
import { buildTwitchPlayerStateScript } from './twitchPlayerSource/buildTwitchPlayerStateScript';
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

/**
 * Polls the VOD <video> element's position and reports it to native so the
 * last-known offset survives a WebView reload. The stock player owns the
 * scrubber; we only observe, so this never fights the user's own seeks.
 */
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

/**
 * The unscripted live player gives no 'playing' bridge event, so the poster is
 * dismissed off WebView load-end. Linger briefly past that so the first decoded
 * frame is already on screen before the loading frame fades away.
 */
const POSTER_HIDE_DELAY_MS = 450;

export const StreamPlayer = memo(function StreamPlayer({
  autoplay = true,
  channel,
  clip,
  deferOverlayUntilUserUnmute = false,
  height,
  muted: initialMuted = false,
  onBackPress,
  onContentGateChange,
  onCreateClipPress,
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
  onSleepTimerPress,
  onVideoAreaPress,
  onVideoAreaSwipeDown,
  onWebViewLoaded,
  posterUrl,
  showOverlayControls = false,
  sleepTimerActive,
  streamInfo,
  video,
  width,
  ref,
}: StreamPlayerProps) {
  // Twitch's embed `parent`, hardcoded to Twitch's own domain, which its embed
  // always accepts. A blank or invalid value makes Twitch render "this embed is
  // misconfigured" and breaks every stream.
  const embedParent = 'www.twitch.tv';
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
  /**
   * Mounting the WebView while the screen-push animation is still running
   * makes WKWebView start the inline video mid-transition; its AVPlayer
   * layer then intermittently never attaches to the compositor (audio and
   * currentTime advance but the picture is black or frozen on one frame).
   * Wait for interactions/transitions to settle before creating the WebView.
   */
  const [canMountWebView, setCanMountWebView] = useState(false);
  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      setCanMountWebView(true);
    });
    return () => task.cancel();
  }, []);

  /**
   * Even when mounted post-transition, WKWebView sometimes fails to attach
   * the inline video's AVPlayer layer to the compositor (picture stays black
   * or frozen while playback advances). The page cannot observe this, so we
   * unconditionally force a frame change shortly after playback starts —
   * resizing the WKWebView makes it rebuild its layer tree and pick the
   * video layer up.
   * With the unscripted player there is no bridge 'playing' event, so the
   * nudge fires off WebView load-end; autoplay starts shortly after, which
   * the second pulse at +2.5s covers.
   */
  const [layoutNudge, setLayoutNudge] = useState(0);
  const nudgeTimeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const nudgePlayedRef = useRef(false);
  /**
   * Loading frame shown over the WebView (stream thumbnail + spinner) until the
   * player has actually started, replacing the black box during page load.
   */
  const [loadedGeneration, setLoadedGeneration] = useState<string | null>(null);
  const generationRef = useRef('');
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
        setLoadedGeneration(generationRef.current);
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

  const sourceKey = `${channel ?? ''}|${clip ?? ''}|${video ?? ''}|${embedParent}|${autoplay}|${initialMuted}|${deferOverlayUntilUserUnmute}`;

  const generation = `${sourceKey}|${webViewKey}`;
  generationRef.current = generation;
  const isPlayerLoading = loadedGeneration !== generation;

  /**
   * Last reported VOD playback offset (seconds). Survives a WebView remount so
   * the embed can resume instead of restarting at 0:00; reset per source.
   */
  const resumeTimeRef = useRef(0);

  useWatchTimeTracking();

  useEffect(() => {
    needsInitRef.current = true;
    nudgePlayedRef.current = false;
    resumeTimeRef.current = 0;
  }, [sourceKey]);

  /**
   * Arm a safety dismissal per generation so a load that never finishes can't
   * trap the loading frame over the player.
   */
  useEffect(() => {
    const timeout = setTimeout(
      () => setLoadedGeneration(generationRef.current),
      PLAYER_LOAD_TIMEOUT_MS,
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

  const enhancedVideoStability = usePreference('enhancedVideoStability');
  let contentKind: 'clip' | 'vod' | 'live' = 'live';
  if (clip) {
    contentKind = 'clip';
  } else if (video) {
    contentKind = 'vod';
  }

  const {
    handleMessage,
    hasContentGate,
    noteWebViewLoadFailed,
    noteWebViewPlaybackStarted,
    overlayUnlocked,
    pause,
    pipActive,
    play,
    playerState,
    playerStatus,
    resetPlayerStatus,
    setMuted,
    togglePictureInPicture,
  } = usePlayerBridge({
    autoplay,
    channel,
    clip,
    contentKind,
    deferOverlayUntilUserUnmute,
    enhancedStabilityEnabled: enhancedVideoStability,
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
    video,
    webViewKey,
  });

  const channelName = channel || 'twitch';
  const awaitBridgePlaybackStart = showOverlayControls && !clip;
  /**
   * Memoised so the URL only changes when the source or a remount (webViewKey)
   * does — never on an incidental re-render (e.g. the layout nudge), which
   * would otherwise reload the WebView. On remount it reads the latest
   * resume offset so a VOD picks up where it left off.
   */
  const webViewSource = useMemo(
    () =>
      clip
        ? {
            uri: buildTwitchClipPlayerUrl({
              clip,
              parent: embedParent,
              autoplay,
              muted: initialMuted,
            }),
          }
        : {
            uri: buildRawTwitchPlayerUrl({
              channel: channelName,
              video,
              parent: embedParent,
              autoplay,
              muted: initialMuted,
              timeSeconds: video ? resumeTimeRef.current : undefined,
            }),
          },
    // eslint-disable-next-line react-hooks/exhaustive-deps, react-doctor/exhaustive-deps
    [clip, channelName, video, embedParent, autoplay, initialMuted, webViewKey],
  );

  /**
   * The stock player.twitch.tv page runs unscripted: Twitch's own UI handles
   * playback, so the playerControls bootstrap is not injected and the bridge
   * (ready/playing/pause messages, native controls overlay) stays dormant.
   * We auto-accept the mature-content gate, hide the text track ('hidden', not
   * 'disabled', which would stall WKWebView's native HLS AVPlayer), and — when
   * autoplaying — nudge the video into unmuted playback since Twitch's embed
   * otherwise tends to land paused/muted. The player's own chrome is hidden
   * only when foam is drawing its own overlay controls over the video.
   */
  const injectedJavaScript =
    TWITCH_AUTH_HELPER_SCRIPT +
    '\n' +
    // Detect Twitch's "this embed is misconfigured" error page (bad parent) on
    // every player kind so a broken embed reports to Sentry instead of only
    // timing out.
    buildTwitchEmbedErrorWatcherScript() +
    '\n' +
    buildTwitchContentGateAcceptScript() +
    '\n' +
    buildTwitchCaptionHiderScript() +
    (autoplay && !clip
      ? '\n' + buildTwitchAutoplayEnsureScript({ muted: initialMuted })
      : '') +
    (showOverlayControls && !clip
      ? '\n' +
        buildTwitchChromeHiderScript() +
        '\n' +
        buildTwitchPlayerStateScript() +
        '\n' +
        buildTwitchContentGateWatcherScript()
      : '') +
    // Live + custom-player only: read broadcaster latency for the chat pill and seek to live at start.
    (showOverlayControls && !clip && !video
      ? '\n' +
        buildTwitchLatencyTrackerScript() +
        '\n' +
        buildTwitchLiveSyncScript({})
      : '') +
    (video ? '\n' + VOD_PROGRESS_TRACKER_SCRIPT : '') +
    // iOS-only: WKWebView is the only WebView with a presentation-mode API.
    (PIP_ENABLED && Platform.OS === 'ios' && !clip
      ? '\n' + buildTwitchPipBridgeScript()
      : '');

  /**
   * The tracker posts unsolicited `vodProgress` messages; capture those for
   * resume-on-reload and forward everything else to the player bridge.
   */
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

  const { controlsOpacity, controlsVisible, handlePlayPause, videoTapGesture } =
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

  const handleMutePress = useCallback(() => {
    setMuted(!playerState.muted);
  }, [playerState.muted, setMuted]);

  const playerWidth = width ?? '100%';
  const playerHeight = height ?? '100%';
  const allowsTwitchInteraction =
    Boolean(clip) || !showOverlayControls || hasContentGate;
  /**
   * Thumbnail behind a transparent WebView so the iOS rotation snapshot shows the poster,
   * not the WebView's black backing. Live only.
   */
  const showBehindThumbnail = Boolean(posterUrl) && !clip && !video;
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
      {showBehindThumbnail ? (
        <Image
          source={posterUrl}
          contentFit='cover'
          containerStyle={StyleSheet.absoluteFill}
          style={styles.behindThumbnail}
        />
      ) : null}

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
          opaque={!showBehindThumbnail}
          onError={onError}
          onHttpError={handleWebViewHttpError}
          onLoadFailed={noteWebViewLoadFailed}
          onMessage={handleWebViewMessage}
          onWebViewLoaded={() => {
            if (!awaitBridgePlaybackStart) {
              noteWebViewPlaybackStarted();
            }
            handleBridgePlaying();
            // Kick autoplay off the WebView-ready signal so the stream starts without a tap.
            if (autoplay && !clip) {
              runJavaScript(
                'window.__foamEnsurePlaying && window.__foamEnsurePlaying(); true;',
              );
            }
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
        <ControlsOverlay
          isVisible={controlsVisible}
          muted={playerState.muted}
          opacity={controlsOpacity}
          onBackPress={onBackPress}
          onMutePress={handleMutePress}
          onPlayPausePress={handlePlayPause}
          onCreateClipPress={onCreateClipPress}
          onPipPress={
            PIP_ENABLED && Platform.OS === 'ios' && !clip
              ? togglePictureInPicture
              : undefined
          }
          onRefresh={onRefresh ? handleRefresh : undefined}
          onSharePress={onSharePress}
          onSleepTimerPress={onSleepTimerPress}
          paused={playerState.isPaused}
          pipActive={pipActive}
          sleepTimerActive={sleepTimerActive}
          streamInfo={streamInfo}
        />
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  behindThumbnail: {
    height: '100%',
    width: '100%',
  },
  container: {
    backgroundColor: theme.colorBlack,
    overflow: 'hidden',
    position: 'relative',
  },
  containerScrollable: {
    overflow: 'visible',
  },
});
