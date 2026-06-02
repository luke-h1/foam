import { recordError } from '@app/lib/sentry';
import { memo, useCallback } from 'react';
import type { ComponentProps, RefObject } from 'react';
import { StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import type {
  OnShouldStartLoadWithRequest,
  WebViewError,
  WebViewHttpError,
} from 'react-native-webview/lib/WebViewTypes';

import {
  isAllowedTwitchPlayerNavigation,
  isAppUrl,
  isTwitchPassportCallbackUrl,
} from './twitchPlayerSource';

type WebViewSource = ComponentProps<typeof WebView>['source'];

interface StreamPlayerWebViewProps {
  allowsTwitchInteraction: boolean;
  channel?: string;
  clip?: string;
  injectedJavaScript?: string;
  injectedJavaScriptBeforeContentLoaded?: string;
  needsInitRef: RefObject<boolean>;
  onError?: (error: string) => void;
  onHttpError: (error: { statusCode: number; url: string }) => void;
  onLoadEnd?: (url: string) => void;
  onMessage: ComponentProps<typeof WebView>['onMessage'];
  onOpenWindow?: ComponentProps<typeof WebView>['onOpenWindow'];
  onWebViewLoaded?: () => void;
  parent: string;
  remountWebView: () => void;
  restrictWebViewNavigationToTwitchPlayer: boolean;
  scheduleAuthCompletionReload: () => void;
  source: WebViewSource;
  video?: string;
  webViewKey: number;
  webViewRef: RefObject<WebView | null>;
}

export const StreamPlayerWebView = memo(function StreamPlayerWebView({
  allowsTwitchInteraction,
  channel,
  clip,
  injectedJavaScript,
  injectedJavaScriptBeforeContentLoaded,
  needsInitRef,
  onError,
  onHttpError,
  onLoadEnd,
  onMessage,
  onOpenWindow,
  onWebViewLoaded,
  parent,
  remountWebView,
  restrictWebViewNavigationToTwitchPlayer,
  scheduleAuthCompletionReload,
  source,
  video,
  webViewKey,
  webViewRef,
}: StreamPlayerWebViewProps) {
  const handleLoadEnd = useCallback(
    (url: string) => {
      onWebViewLoaded?.();
      if (isTwitchPassportCallbackUrl(url)) {
        scheduleAuthCompletionReload();
        return;
      }
      onLoadEnd?.(url);
      if (needsInitRef.current) {
        needsInitRef.current = false;
      }
    },
    [needsInitRef, onLoadEnd, onWebViewLoaded, scheduleAuthCompletionReload],
  );

  const handleShouldStartLoadWithRequest =
    useCallback<OnShouldStartLoadWithRequest>(
      request => {
        if (isAppUrl(request.url)) {
          return false;
        }

        if (!restrictWebViewNavigationToTwitchPlayer) {
          return true;
        }

        if (request.isTopFrame === false) {
          return true;
        }

        return isAllowedTwitchPlayerNavigation(request.url, parent);
      },
      [parent, restrictWebViewNavigationToTwitchPlayer],
    );

  const handleWebViewError = useCallback(
    (event: { nativeEvent: WebViewError }) => {
      const { nativeEvent } = event;
      console.warn('[StreamPlayer:WebView ERROR]', {
        code: nativeEvent.code,
        description: nativeEvent.description,
        url: nativeEvent.url,
      });

      recordError({
        name: 'stream_error',
        message: `StreamPlayer WebView error: ${nativeEvent.description}`,
        params: {
          category: 'Stream',
          action: 'webview_error',
          code: nativeEvent.code,
          description: nativeEvent.description,
          url: nativeEvent.url,
          channel,
        },
        errorCause: nativeEvent,
      });

      onError?.(nativeEvent.description);
    },
    [channel, onError],
  );

  const handleWebViewHttpError = useCallback(
    (event: { nativeEvent: WebViewHttpError }) => {
      const { nativeEvent } = event;
      console.warn('[StreamPlayer:HTTP ERROR]', {
        statusCode: nativeEvent.statusCode,
        url: nativeEvent.url,
        description: nativeEvent.description,
      });

      onHttpError({
        url: nativeEvent.url,
        statusCode: nativeEvent.statusCode,
      });

      recordError({
        name: 'stream_error',
        message: `StreamPlayer HTTP error: ${nativeEvent.statusCode} ${nativeEvent.description}`,
        params: {
          category: 'Stream',
          action: 'webview_http_error',
          statusCode: nativeEvent.statusCode,
          description: nativeEvent.description,
          url: nativeEvent.url,
          channel,
        },
        errorCause: nativeEvent,
      });

      onError?.(`HTTP ${nativeEvent.statusCode}: ${nativeEvent.description}`);
    },
    [channel, onError, onHttpError],
  );

  const handleLoadStart = useCallback(
    (renderer: 'WebView') => {
      if (__DEV__) {
        console.warn(`[StreamPlayer:${renderer}] onLoadStart`, {
          channel,
          hasClip: !!clip,
          hasVideo: !!video,
        });
      }
    },
    [channel, clip, video],
  );

  return (
    <WebView
      key={webViewKey}
      ref={webViewRef}
      allowsFullscreenVideo={false}
      allowsInlineMediaPlayback
      allowsAirPlayForMediaPlayback={false}
      allowsPictureInPictureMediaPlayback={false}
      androidLayerType='hardware'
      cacheEnabled
      cacheMode='LOAD_CACHE_ELSE_NETWORK'
      domStorageEnabled
      javaScriptEnabled
      javaScriptCanOpenWindowsAutomatically
      mediaPlaybackRequiresUserAction={false}
      mixedContentMode='never'
      nestedScrollEnabled={false}
      overScrollMode='never'
      scrollEnabled={allowsTwitchInteraction}
      keyboardDisplayRequiresUserAction={!allowsTwitchInteraction}
      setBuiltInZoomControls={false}
      setDisplayZoomControls={false}
      setSupportMultipleWindows={false}
      sharedCookiesEnabled
      thirdPartyCookiesEnabled
      textInteractionEnabled={false}
      originWhitelist={['*']}
      source={source}
      injectedJavaScript={injectedJavaScript}
      injectedJavaScriptBeforeContentLoaded={
        injectedJavaScriptBeforeContentLoaded
      }
      injectedJavaScriptBeforeContentLoadedForMainFrameOnly={false}
      injectedJavaScriptForMainFrameOnly={false}
      style={[
        styles.webView,
        allowsTwitchInteraction && styles.webViewScrollable,
      ]}
      onContentProcessDidTerminate={remountWebView}
      onError={handleWebViewError}
      onHttpError={handleWebViewHttpError}
      onNavigationStateChange={event => {
        if (isTwitchPassportCallbackUrl(event.url)) {
          scheduleAuthCompletionReload();
        }
      }}
      onOpenWindow={onOpenWindow}
      onShouldStartLoadWithRequest={handleShouldStartLoadWithRequest}
      onLoadEnd={event => handleLoadEnd(event.nativeEvent.url)}
      onLoadStart={() => handleLoadStart('WebView')}
      onMessage={onMessage}
      onRenderProcessGone={remountWebView}
    />
  );
});

const styles = StyleSheet.create({
  webView: {
    backgroundColor: '#000',
    flex: 1,
    height: '100%',
    width: '100%',
  },
  webViewScrollable: {
    minHeight: '100%',
  },
});
