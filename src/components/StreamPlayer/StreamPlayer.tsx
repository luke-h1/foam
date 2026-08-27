import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { InteractionManager, Platform, StyleSheet, View } from 'react-native';
import type { WebViewMessageEvent } from 'react-native-webview';
import { WebView } from 'react-native-webview';

import { useOnAppStateChange } from '@app/hooks/useOnAppStateChange';
import { useWatchTimeTracking } from '@app/hooks/useWatchTimeTracking';
import { usePreference } from '@app/store/preferenceStore';
import { theme } from '@app/styles/themes';
import { isForegroundTransition } from '@app/utils/appState/appStateTransitions';
import { logger } from '@app/utils/logger';

import { Image } from '../Image/Image';
import { ControlsOverlay } from './ControlsOverlay';
import { PIP_ENABLED } from './pipFeature';
import { PLAYER_LOAD_TIMEOUT_MS } from './playerTelemetry';
import { DebugErrorOverlay, TouchBlockOverlay } from './StreamPlayerOverlays';
import { StreamPlayerPoster } from './StreamPlayerPoster';
import { StreamPlayerWebView } from './StreamPlayerWebView';
import { buildRawTwitchPlayerUrl } from './twitchPlayerSource/buildRawTwitchPlayerUrl';
import {
  buildStreamPlayerInjectedJavaScript,
  buildTwitchAuthHelperScript,
} from './twitchPlayerSource/buildStreamPlayerInjectedJavaScript';
import { buildTwitchClipPlayerUrl } from './twitchPlayerSource/buildTwitchClipPlayerUrl';
import { buildTwitchPlayerAudioDefaultScript } from './twitchPlayerSource/buildTwitchPlayerAudioDefaultScript';
import { buildTwitchPlayerQualityDefaultScript } from './twitchPlayerSource/buildTwitchPlayerQualityDefaultScript';
import type { StreamPlayerProps } from './types';
import { usePlayerBridge } from './usePlayerBridge';
import { useStreamPlayerControls } from './useStreamPlayerControls';

export type { StreamInfo, StreamPlayerProps, StreamPlayerRef } from './types';

/**
 * Linger so the first decoded frame is on screen before the poster fades.
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
  // Twitch always accepts its own domain as embed `parent`; a blank or invalid
  // value renders "this embed is misconfigured" and breaks every stream.
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
   * Mount after interactions settle: a mid-transition WKWebView start can
   * leave the AVPlayer layer detached (audio advances, picture black).
   */
  const [canMountWebView, setCanMountWebView] = useState(false);
  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      setCanMountWebView(true);
    });
    return () => task.cancel();
  }, []);

  /**
   * Force a resize after playback starts to rebuild the layer tree when
   * WKWebView fails to attach the AVPlayer layer; +2.5s pulse covers late autoplay.
   */
  const [layoutNudge, setLayoutNudge] = useState(0);
  const nudgeTimeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const nudgePlayedRef = useRef(false);
  const nudgeLayerTree = useCallback(() => {
    nudgeTimeoutsRef.current.forEach(clearTimeout);
    nudgeTimeoutsRef.current = [];
    const pulse = (delay: number) => {
      nudgeTimeoutsRef.current.push(
        setTimeout(() => setLayoutNudge(1), delay),
        setTimeout(() => setLayoutNudge(0), delay + 120),
      );
    };
    pulse(0);
    pulse(2500);
  }, []);
  /**
   * Loading frame stays over the WebView until playback starts, hiding the
   * black box during page load.
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
    nudgeLayerTree();
  }, [nudgeLayerTree]);

  /**
   * iOS does not reliably re-attach the AVPlayer layer after backgrounding,
   * so pulse again on every foreground.
   */
  useOnAppStateChange(transition => {
    if (isForegroundTransition(transition)) {
      nudgeLayerTree();
    }
  });

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
  useEffect(() => {
    generationRef.current = generation;
  }, [generation]);
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
   * URL must only change on source change or remount (webViewKey) - an
   * incidental re-render would reload the WebView.
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

  const injectedJavaScript = buildStreamPlayerInjectedJavaScript({
    autoplay,
    clip,
    initialMuted,
    showOverlayControls,
    video,
  });

  /**
   * Captures the tracker's `vodProgress` messages for resume-on-reload;
   * everything else forwards to the player bridge.
   */
  const handleWebViewMessage = useCallback(
    (event: WebViewMessageEvent) => {
      try {
        // SAFETY: only the tracker script sends `vodProgress`; fields are re-checked before use.
        const message = JSON.parse(event.nativeEvent.data) as {
          type?: string;
          payload?: { currentTime?: number };
        };
        if (message.type === 'vodProgress') {
          const time = message.payload?.currentTime;
          if (time !== undefined && Number.isFinite(time)) {
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
    ? buildTwitchAuthHelperScript()
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
