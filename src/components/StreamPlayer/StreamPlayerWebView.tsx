import { recordError } from '@app/lib/sentry';
import { UIKitWebView } from '@modules/ui-kit-webview';
import { memo, useCallback } from 'react';
import type { ComponentProps, RefObject } from 'react';
import { Platform, StyleSheet } from 'react-native';
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
  TWITCH_PLAYER_WEBSITE_URL,
} from './twitchPlayerSource';

type WebViewSource = ComponentProps<typeof WebView>['source'];

interface StreamPlayerWebViewProps {
  allowsTwitchInteraction: boolean;
  channel?: string;
  clip?: string;
  needsInitRef: RefObject<boolean>;
  onError?: (error: string) => void;
  onHttpError: (error: { statusCode: number; url: string }) => void;
  onMessage: ComponentProps<typeof WebView>['onMessage'];
  onWebViewLoaded?: () => void;
  parent: string;
  remountWebView: () => void;
  restrictWebViewNavigationToTwitchPlayer: boolean;
  scheduleAuthCompletionReload: () => void;
  source: WebViewSource;
  useUIKitForWebView: boolean;
  video?: string;
  webViewKey: number;
  webViewRef: RefObject<WebView | null>;
}

export const StreamPlayerWebView = memo(function StreamPlayerWebView({
  allowsTwitchInteraction,
  channel,
  clip,
  needsInitRef,
  onError,
  onHttpError,
  onMessage,
  onWebViewLoaded,
  parent,
  remountWebView,
  restrictWebViewNavigationToTwitchPlayer,
  scheduleAuthCompletionReload,
  source,
  useUIKitForWebView,
  video,
  webViewKey,
  webViewRef,
}: StreamPlayerWebViewProps) {
  const webViewUrl = source && 'uri' in source ? source.uri : undefined;
  const shouldUseUIKitWebView =
    useUIKitForWebView && Platform.OS === 'ios' && Boolean(webViewUrl);

  const handleLoadEnd = useCallback(
    (url: string) => {
      onWebViewLoaded?.();
      if (isTwitchPassportCallbackUrl(url)) {
        scheduleAuthCompletionReload();
        return;
      }
      if (needsInitRef.current) {
        needsInitRef.current = false;
      }
    },
    [needsInitRef, onWebViewLoaded, scheduleAuthCompletionReload],
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

        return isAllowedTwitchPlayerNavigation(
          request.url,
          parent,
          TWITCH_PLAYER_WEBSITE_URL,
        );
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

  const handleUIKitWebViewError = useCallback(
    (event: {
      nativeEvent: {
        code: number;
        description: string;
        domain: string;
        url: string;
      };
    }) => {
      const { nativeEvent } = event;
      console.warn('[StreamPlayer:UIKitWebView ERROR]', {
        code: nativeEvent.code,
        description: nativeEvent.description,
        domain: nativeEvent.domain,
        url: nativeEvent.url,
      });

      recordError({
        name: 'stream_error',
        message: `StreamPlayer UIKit WebView error: ${nativeEvent.description}`,
        params: {
          category: 'Stream',
          action: 'uikit_webview_error',
          code: nativeEvent.code,
          description: nativeEvent.description,
          domain: nativeEvent.domain,
          url: nativeEvent.url,
          channel,
        },
        errorCause: nativeEvent,
      });

      onError?.(nativeEvent.description);
    },
    [channel, onError],
  );

  const handleLoadStart = useCallback(
    (renderer: 'UIKitWebView' | 'WebView') => {
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

  if (shouldUseUIKitWebView && webViewUrl) {
    return (
      <UIKitWebView
        key={webViewKey}
        allowsFullscreenVideo={false}
        scrollEnabled={allowsTwitchInteraction}
        keyboardDisplayRequiresUserAction={!allowsTwitchInteraction}
        url={webViewUrl}
        style={[
          styles.webView,
          allowsTwitchInteraction && styles.webViewScrollable,
        ]}
        onError={handleUIKitWebViewError}
        onNavigationStateChange={event => {
          if (isTwitchPassportCallbackUrl(event.nativeEvent.url)) {
            scheduleAuthCompletionReload();
          }
        }}
        onLoadEnd={event => handleLoadEnd(event.nativeEvent.url)}
        onLoadStart={() => handleLoadStart('UIKitWebView')}
      />
    );
  }

  return (
    <WebView
      key={webViewKey}
      ref={webViewRef}
      allowsFullscreenVideo={false}
      allowsInlineMediaPlayback
      cacheEnabled
      domStorageEnabled
      javaScriptEnabled
      javaScriptCanOpenWindowsAutomatically
      mediaPlaybackRequiresUserAction={false}
      scrollEnabled={allowsTwitchInteraction}
      keyboardDisplayRequiresUserAction={!allowsTwitchInteraction}
      setBuiltInZoomControls={false}
      setDisplayZoomControls={false}
      setSupportMultipleWindows={false}
      sharedCookiesEnabled
      thirdPartyCookiesEnabled
      originWhitelist={['*']}
      source={source}
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
