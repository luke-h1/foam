import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { InteractionManager, StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

import { useWatchTimeTracking } from '@app/hooks/use-watch-time-tracking';
import { usePreference } from '@app/store/preference-store';
import { theme } from '@app/styles/themes';

import { Image } from '../image/image';
import { usePlayerBridge } from './hooks/use-player-bridge';
import { useStreamPlayerControls } from './hooks/use-stream-player-controls';
import { useStreamPlayerLifecycle } from './hooks/use-stream-player-lifecycle';
import { useStreamPlayerSource } from './hooks/use-stream-player-source';
import { useWebViewMessageRouter } from './hooks/use-web-view-message-router';
import { StreamPlayerOverlayStack } from './stream-player-overlay-stack';
import { StreamPlayerPoster } from './stream-player-poster';
import { StreamPlayerWebView } from './stream-player-web-view';
import type { StreamPlayerProps } from './types';
import { buildStreamSourceKey } from './util/build-stream-source-key';
import { getStreamPlayerVisibility } from './util/get-stream-player-visibility';

export type { StreamInfo, StreamPlayerProps, StreamPlayerRef } from './types';

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

  const sourceKey = buildStreamSourceKey({
    autoplay,
    channel,
    clip,
    deferOverlayUntilUserUnmute,
    embedParent,
    initialMuted,
    video,
  });

  const {
    handleBridgePlaying,
    handlePlayerLayout,
    isPlayerLoading,
    layoutNudge,
    needsInitRef,
    remountEmbedWebView,
    resumeTimeRef,
    scheduleAuthCompletionReload,
    webViewKey,
  } = useStreamPlayerLifecycle({ channel, sourceKey });

  const {
    contentKind,
    injectedJavaScript,
    injectedJavaScriptBeforeContentLoaded,
    webViewSource,
  } = useStreamPlayerSource({
    autoplay,
    channel,
    clip,
    embedParent,
    initialMuted,
    resumeTimeRef,
    showOverlayControls,
    video,
    webViewKey,
  });

  useWatchTimeTracking();

  const runJavaScript = (script: string) => {
    webViewRef.current?.injectJavaScript(script);
  };

  const enhancedVideoStability = usePreference('enhancedVideoStability');

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

  const handleWebViewMessage = useWebViewMessageRouter({
    handleMessage,
    resumeTimeRef,
  });

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

  const {
    allowsTwitchInteraction,
    awaitBridgePlaybackStart,
    showBehindThumbnail,
    showNativeControls,
  } = getStreamPlayerVisibility({
    clip,
    deferOverlayUntilUserUnmute,
    hasContentGate,
    isPlayerReady: playerStatus.isReady,
    overlayUnlocked,
    posterUrl,
    showOverlayControls,
    video,
  });

  const handleWebViewLoaded = () => {
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
  };

  return (
    <View
      collapsable={false}
      onLayout={handlePlayerLayout}
      style={[
        styles.container,
        { width: width ?? '100%', height: height ?? '100%' },
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
          onWebViewLoaded={handleWebViewLoaded}
          remountWebView={remountEmbedWebView}
          scheduleAuthCompletionReload={scheduleAuthCompletionReload}
          source={webViewSource}
          video={video}
          webViewKey={webViewKey}
          webViewRef={webViewRef}
        />
      ) : null}

      <StreamPlayerPoster posterUrl={posterUrl} visible={isPlayerLoading} />

      <StreamPlayerOverlayStack
        clip={clip}
        controlsOpacity={controlsOpacity}
        controlsVisible={controlsVisible}
        lastHttpError={lastHttpError}
        muted={playerState.muted}
        onBackPress={onBackPress}
        onCreateClipPress={onCreateClipPress}
        onDismissHttpError={() => setLastHttpError(null)}
        onMutePress={handleMutePress}
        onPlayPausePress={handlePlayPause}
        onRefresh={onRefresh ? handleRefresh : undefined}
        onSharePress={onSharePress}
        onSleepTimerPress={onSleepTimerPress}
        paused={playerState.isPaused}
        pipActive={pipActive}
        showNativeControls={showNativeControls}
        sleepTimerActive={sleepTimerActive}
        streamInfo={streamInfo}
        togglePictureInPicture={togglePictureInPicture}
        videoTapGesture={videoTapGesture}
      />
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
