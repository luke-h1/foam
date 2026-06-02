import {
  forwardRef,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

import { ControlsOverlay } from './ControlsOverlay';
import { StreamPlayerWebView } from './StreamPlayerWebView';
import {
  ControlsTriggerButton,
  DebugErrorOverlay,
  TouchBlockOverlay,
} from './StreamPlayerOverlays';
import { streamWebViewWarmupPool } from './WebViewWarmupPool';
import {
  buildRawTwitchPlayerBootstrapScript,
  buildRawTwitchPlayerUrl,
  buildTwitchClipPlayerUrl,
  isAllowedTwitchPlayerNavigation,
  isAppUrl,
  isTwitchPassportCallbackUrl,
} from './twitchPlayerSource';
import type { StreamPlayerProps, StreamPlayerRef } from './types';
import { usePlayerBridge } from './usePlayerBridge';
import { useStreamPlayerControls } from './useStreamPlayerControls';

export {
  buildRawTwitchPlayerUrl,
  buildTwitchClipPlayerUrl,
  isAllowedTwitchPlayerNavigation,
  isAppUrl,
  isTwitchPassportCallbackUrl,
};
export { formatDuration } from './ControlsOverlay';
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
    subtree: true,
  });
})();
true;
`;

export const StreamPlayer = memo(
  forwardRef<StreamPlayerRef, StreamPlayerProps>(function StreamPlayer(
    {
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
      onVideoAreaPress,
      onVideoAreaSwipeDown,
      onWebViewLoaded,
      parent = 'www.twitch.tv',
      restrictWebViewNavigationToTwitchPlayer = false,
      showOverlayControls = false,
      streamInfo,
      video,
      width,
    },
    ref,
  ) {
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
      return () => {
        if (authCompletionReloadTimeoutRef.current) {
          clearTimeout(authCompletionReloadTimeoutRef.current);
          authCompletionReloadTimeoutRef.current = null;
        }
      };
    }, []);

    useEffect(() => {
      if (!clip) {
        streamWebViewWarmupPool.startWarmup(parent);
      }
    }, [clip, parent]);

    const runJavaScript = useCallback((script: string) => {
      webViewRef.current?.injectJavaScript(script);
    }, []);

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

    const webViewSource = useMemo(() => {
      const channelName = channel || 'twitch';
      if (clip) {
        return {
          uri: buildTwitchClipPlayerUrl({
            clip,
            parent,
            autoplay,
            muted: initialMuted,
          }),
        };
      }

      return {
        uri: buildRawTwitchPlayerUrl({
          channel: channelName,
          video,
          parent,
          autoplay,
          muted: initialMuted,
        }),
      };
    }, [autoplay, channel, clip, initialMuted, parent, video]);

    const injectedJavaScript = useMemo(() => {
      if (!clip) {
        return `${TWITCH_AUTH_HELPER_SCRIPT}
${buildRawTwitchPlayerBootstrapScript({
  autoplay,
  debug: __DEV__,
  muted: initialMuted,
})}`;
      }

      return TWITCH_AUTH_HELPER_SCRIPT;
    }, [autoplay, clip, initialMuted]);

    const injectedJavaScriptBeforeContentLoaded = clip
      ? TWITCH_AUTH_HELPER_SCRIPT
      : undefined;

    const handleWebViewHttpError = useCallback(
      (error: { statusCode: number; url: string }) => {
        setLastHttpError(error);
      },
      [],
    );

    const {
      controlsVisible,
      handlePlayPause,
      toggleControls,
      videoTapGesture,
    } = useStreamPlayerControls({
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
            onToggleControls={toggleControls}
            paused={playerState.isPaused}
            streamInfo={streamInfo}
          />
        )}
      </View>
    );
  }),
);

StreamPlayer.displayName = 'StreamPlayer';

export function StreamPlayerPrewarm({
  parent = 'www.twitch.tv',
}: {
  parent?: string;
}) {
  const warmupProps = streamWebViewWarmupPool.getWarmupRenderProps(parent);

  if (!warmupProps) {
    return null;
  }

  return (
    <View style={styles.prewarmHidden}>
      <WebView
        key={warmupProps.key}
        source={warmupProps.source}
        onMessage={warmupProps.onMessage}
        onLoadEnd={warmupProps.onLoadEnd}
        javaScriptEnabled
        domStorageEnabled
        cacheEnabled
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        originWhitelist={['*']}
        scrollEnabled
        setSupportMultipleWindows={false}
        sharedCookiesEnabled
        thirdPartyCookiesEnabled
        style={styles.prewarmWebView}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#000',
    overflow: 'hidden',
    position: 'relative',
  },
  containerScrollable: {
    overflow: 'visible',
  },
  prewarmHidden: {
    height: 1,
    left: -10000,
    opacity: 0,
    overflow: 'hidden',
    position: 'absolute',
    top: -10000,
    width: 1,
  },
  prewarmWebView: {
    backgroundColor: '#000',
    height: 1,
    width: 1,
  },
});
