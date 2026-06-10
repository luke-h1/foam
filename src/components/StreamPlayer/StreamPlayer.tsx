import { useWatchTimeTracking } from '@app/hooks/useWatchTimeTracking';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

import { ControlsOverlay } from './ControlsOverlay';
import { StreamPlayerWebView } from './StreamPlayerWebView';
import {
  ControlsTriggerButton,
  DebugErrorOverlay,
  TouchBlockOverlay,
} from './StreamPlayerOverlays';
import {
  buildRawTwitchPlayerBootstrapScript,
  buildRawTwitchPlayerUrl,
  buildTwitchClipPlayerUrl,
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
  restrictWebViewNavigationToTwitchPlayer = false,
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

  const sourceKey = `${channel ?? ''}|${clip ?? ''}|${video ?? ''}|${parent}|${autoplay}|${initialMuted}|${deferOverlayUntilUserUnmute}`;

  useWatchTimeTracking();

  useEffect(() => {
    needsInitRef.current = true;
  }, [sourceKey]);

  const remountEmbedWebView = useCallback(() => {
    needsInitRef.current = true;
    setWebViewKey(key => key + 1);
  }, []);

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
    onPlay,
    onReady,
    ref,
    runJavaScript,
    scheduleAuthCompletionReload,
    sourceKey,
    webViewKey,
  });

  const channelName = channel || 'twitch';
  const webViewSource = clip
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
        }),
      };

  const injectedJavaScript = !clip
    ? `${TWITCH_AUTH_HELPER_SCRIPT}
${buildRawTwitchPlayerBootstrapScript({
  autoplay,
  debug: __DEV__,
  muted: initialMuted,
})}`
    : TWITCH_AUTH_HELPER_SCRIPT;

  const injectedJavaScriptBeforeContentLoaded = clip
    ? TWITCH_AUTH_HELPER_SCRIPT
    : buildTwitchPlayerQualityDefaultScript({
        defaultQuality: '720p60',
        maxBitrateBps: 3_500_000,
      });

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
        hasContentGate && styles.containerScrollable,
      ]}
    >
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
        onMessage={handleMessage}
        onWebViewLoaded={onWebViewLoaded}
        parent={parent}
        remountWebView={remountEmbedWebView}
        restrictWebViewNavigationToTwitchPlayer={
          restrictWebViewNavigationToTwitchPlayer
        }
        scheduleAuthCompletionReload={scheduleAuthCompletionReload}
        source={webViewSource}
        video={video}
        webViewKey={webViewKey}
        webViewRef={webViewRef}
      />

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
