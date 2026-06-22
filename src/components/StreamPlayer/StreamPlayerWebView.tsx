import { memo } from 'react';
import { StyleSheet } from 'react-native';
import type { ComponentProps, RefObject } from 'react';
import { WebView } from 'react-native-webview';
import type {
  OnShouldStartLoadWithRequest,
  WebViewError,
  WebViewHttpError,
} from 'react-native-webview/lib/WebViewTypes';

import { countMetric } from '@app/lib/sentry';
import { logger } from '@app/utils/logger';

import { isAppUrl, isTwitchPassportCallbackUrl } from './twitchPlayerSource';

type WebViewSource = ComponentProps<typeof WebView>['source'];

// The player webview does no navigation interception beyond refusing the app's
// own deep-link scheme. Twitch's login (id.twitch.tv), passport-callback, and
// any in-player links are all allowed to proceed.
const handleShouldStartLoadWithRequest: OnShouldStartLoadWithRequest =
  request => !isAppUrl(request.url);

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
  remountWebView: () => void;
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
  remountWebView,
  scheduleAuthCompletionReload,
  source,
  video,
  webViewKey,
  webViewRef,
}: StreamPlayerWebViewProps) {
  const handleLoadEnd = (url: string) => {
    onWebViewLoaded?.();
    if (isTwitchPassportCallbackUrl(url)) {
      scheduleAuthCompletionReload();
      return;
    }
    onLoadEnd?.(url);
    if (needsInitRef.current) {
      needsInitRef.current = false;
    }
  };

  const handleWebViewError = (event: { nativeEvent: WebViewError }) => {
    const { nativeEvent } = event;
    logger.main.error(
      `StreamPlayer WebView error: ${nativeEvent.description}`,
      {
        name: 'stream_error',
        error: nativeEvent,
        category: 'Stream',
        action: 'webview_error',
        code: nativeEvent.code,
        description: nativeEvent.description,
        url: nativeEvent.url,
        channel,
      },
    );

    onError?.(nativeEvent.description);
  };

  const handleWebViewHttpError = (event: { nativeEvent: WebViewHttpError }) => {
    const { nativeEvent } = event;
    onHttpError({
      url: nativeEvent.url,
      statusCode: nativeEvent.statusCode,
    });

    logger.main.error(
      `StreamPlayer HTTP error: ${nativeEvent.statusCode} ${nativeEvent.description}`,
      {
        name: 'stream_error',
        error: nativeEvent,
        category: 'Stream',
        action: 'webview_http_error',
        statusCode: nativeEvent.statusCode,
        description: nativeEvent.description,
        url: nativeEvent.url,
        channel,
      },
    );

    onError?.(`HTTP ${nativeEvent.statusCode}: ${nativeEvent.description}`);
  };

  // WKWebView kills its content process under memory pressure (and Android
  // its render process); the player goes black until the remount completes.
  // Previously this happened silently — record it so field blank-player
  // reports can be correlated with process kills.
  const handleWebViewProcessGone = (
    reason: 'content_process_terminated' | 'render_process_gone',
  ) => {
    countMetric('stream.webview_process_gone', {
      channel: channel ?? 'unknown',
      reason,
    });
    logger.main.warn(`WebView process gone (${reason}), remounting player`, {
      name: 'twitch_player_warning',
      channel,
      reason,
    });
    remountWebView();
  };

  const handleLoadStart = (renderer: 'WebView') => {
    logger.main.debug(`[StreamPlayer:${renderer}] onLoadStart`, {
      channel,
      hasClip: !!clip,
      hasVideo: !!video,
    });
  };

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
      onContentProcessDidTerminate={() =>
        handleWebViewProcessGone('content_process_terminated')
      }
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
      onRenderProcessGone={() =>
        handleWebViewProcessGone('render_process_gone')
      }
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
