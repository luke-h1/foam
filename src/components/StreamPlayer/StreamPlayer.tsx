import {
  forwardRef,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Platform, type DimensionValue, StyleSheet, View } from 'react-native';
import type { WebView } from 'react-native-webview';

import { ControlsOverlay, formatDuration } from './ControlsOverlay';
import {
  ControlsTriggerButton,
  DebugErrorOverlay,
  TouchBlockOverlay,
} from './StreamPlayerOverlays';
import { StreamPlayerWebView } from './StreamPlayerWebView';
import {
  buildHostedTwitchPlayerUrl,
  buildRawTwitchPlayerUrl,
  buildRawTwitchPlayerBootstrapScript,
  buildTwitchClipPlayerUrl,
  buildTwitchEmbedHtml,
  isAllowedTwitchPlayerNavigation,
  isAppUrl,
  isTwitchPassportCallbackUrl,
  TWITCH_PLAYER_WEBSITE_URL,
} from './twitchPlayerSource';
import type { StreamPlayerProps, StreamPlayerRef } from './types';
import { usePlayerBridge } from './usePlayerBridge';
import { useStreamPlayerControls } from './useStreamPlayerControls';

export {
  buildHostedTwitchPlayerUrl,
  buildRawTwitchPlayerUrl,
  buildTwitchClipPlayerUrl,
  formatDuration,
  isAllowedTwitchPlayerNavigation,
  isAppUrl,
  isTwitchPassportCallbackUrl,
};
export type { StreamInfo, StreamPlayerProps, StreamPlayerRef } from './types';

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
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      streamProxyBaseUrl: _streamProxyBaseUrl,
      restrictWebViewNavigationToTwitchPlayer = false,
      showOverlayControls = true,
      streamInfo,
      useRawTwitchPlayer = true,
      useUIKitForWebView = false,
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
      statusCode: number;
      url: string;
    } | null>(null);
    const [javaScriptCommand, setJavaScriptCommand] = useState<string>();
    const javaScriptCommandIdRef = useRef(0);
    const usesHostedPlayer =
      !useRawTwitchPlayer && Boolean(TWITCH_PLAYER_WEBSITE_URL);
    const sourceKey = `${channel ?? ''}:${clip ?? ''}:${video ?? ''}`;

    const remountWebView = useCallback(() => {
      needsInitRef.current = true;
      setWebViewKey(k => k + 1);
    }, []);

    const scheduleAuthCompletionReload = useCallback(() => {
      if (authCompletionReloadTimeoutRef.current) {
        return;
      }

      authCompletionReloadTimeoutRef.current = setTimeout(() => {
        authCompletionReloadTimeoutRef.current = null;
        remountWebView();
      }, 750);
    }, [remountWebView]);

    const runJavaScript = useCallback(
      (script: string) => {
        if (useUIKitForWebView && Platform.OS === 'ios') {
          javaScriptCommandIdRef.current += 1;
          setJavaScriptCommand(
            `/* foam-command:${javaScriptCommandIdRef.current} */\n${script}`,
          );
          return;
        }

        webViewRef.current?.injectJavaScript(script);
      },
      [useUIKitForWebView],
    );

    const bridge = usePlayerBridge({
      autoplay,
      channel,
      deferOverlayUntilUserUnmute,
      forceRefresh: remountWebView,
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
      usesHostedPlayer,
      webViewKey,
    });

    useEffect(() => {
      return () => {
        if (authCompletionReloadTimeoutRef.current) {
          clearTimeout(authCompletionReloadTimeoutRef.current);
          authCompletionReloadTimeoutRef.current = null;
        }
      };
    }, []);

    useEffect(() => {
      needsInitRef.current = true;
    }, [sourceKey]);

    const webViewSource = useMemo(() => {
      const channelName = channel || 'twitch';
      const sourceMuted = deferOverlayUntilUserUnmute ? true : initialMuted;
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

      if (useRawTwitchPlayer) {
        return {
          uri: buildRawTwitchPlayerUrl({
            channel: channelName,
            video,
            parent,
            autoplay: false,
            muted: initialMuted,
          }),
        };
      }

      const hostedPlayerUrl = buildHostedTwitchPlayerUrl({
        channel: channelName,
        video,
        autoplay: true,
        muted: sourceMuted,
        debug: __DEV__,
        playerWebsiteUrl: TWITCH_PLAYER_WEBSITE_URL,
      });

      return hostedPlayerUrl
        ? { uri: hostedPlayerUrl }
        : {
            html: buildTwitchEmbedHtml({
              channel: channelName,
              video,
              parent,
              autoplay: true,
              muted: sourceMuted,
              debug: __DEV__,
              width: '100%',
              height: '100%',
            }),
            baseUrl: `https://${parent}/`,
          };
    }, [
      channel,
      clip,
      video,
      parent,
      autoplay,
      initialMuted,
      deferOverlayUntilUserUnmute,
      useRawTwitchPlayer,
    ]);

    const injectedJavaScript = useMemo(() => {
      if (!useRawTwitchPlayer || clip) {
        return undefined;
      }

      return buildRawTwitchPlayerBootstrapScript({
        autoplay,
        debug: __DEV__,
      });
    }, [autoplay, clip, useRawTwitchPlayer]);

    const controls = useStreamPlayerControls({
      onVideoAreaPress,
      onVideoAreaSwipeDown,
      pause: bridge.pause,
      play: bridge.play,
      playerIsPaused: bridge.playerState.isPaused,
    });

    const playerWidth: DimensionValue = width ?? '100%';
    const playerHeight: DimensionValue = height ?? '100%';
    const allowsTwitchInteraction = Boolean(clip) || bridge.hasContentGate;
    const shouldShowNativeControls =
      showOverlayControls &&
      !clip &&
      !allowsTwitchInteraction &&
      bridge.playerStatus.isReady &&
      (!deferOverlayUntilUserUnmute || bridge.overlayUnlocked);

    return (
      <View
        collapsable={false}
        style={[
          styles.container,
          { width: playerWidth, height: playerHeight },
          bridge.hasContentGate && styles.containerScrollable,
        ]}
      >
        <StreamPlayerWebView
          allowsTwitchInteraction={allowsTwitchInteraction}
          channel={channel}
          clip={clip}
          needsInitRef={needsInitRef}
          onError={onError}
          onHttpError={setLastHttpError}
          onMessage={bridge.handleMessage}
          injectedJavaScript={injectedJavaScript}
          javaScriptCommand={javaScriptCommand}
          onWebViewLoaded={onWebViewLoaded}
          parent={parent}
          remountWebView={remountWebView}
          restrictWebViewNavigationToTwitchPlayer={
            restrictWebViewNavigationToTwitchPlayer
          }
          scheduleAuthCompletionReload={scheduleAuthCompletionReload}
          source={webViewSource}
          rawTwitchPlayerAutoplay={autoplay}
          useUIKitForWebView={useUIKitForWebView}
          video={video}
          webViewKey={webViewKey}
          webViewRef={webViewRef}
        />

        {shouldShowNativeControls && (
          <TouchBlockOverlay gesture={controls.videoTapGesture} />
        )}

        {__DEV__ && lastHttpError && (
          <DebugErrorOverlay
            error={lastHttpError}
            onDismiss={() => setLastHttpError(null)}
          />
        )}

        {shouldShowNativeControls && (
          <ControlsTriggerButton onPress={controls.toggleControls} />
        )}

        {shouldShowNativeControls && (
          <ControlsOverlay
            isVisible={controls.controlsVisible}
            latencySeconds={bridge.playbackLatencySeconds}
            onBackPress={onBackPress}
            onPlayPausePress={controls.handlePlayPause}
            onRefresh={onRefresh}
            onToggleControls={controls.toggleControls}
            paused={bridge.playerState.isPaused}
            streamInfo={streamInfo}
          />
        )}
      </View>
    );
  }),
);

StreamPlayer.displayName = 'StreamPlayer';

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
