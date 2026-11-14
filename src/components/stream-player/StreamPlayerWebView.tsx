import { memo } from 'react';
import { StyleSheet } from 'react-native';
import type { RefObject } from 'react';
import { WebView, type WebViewProps } from 'react-native-webview';
import type {
  OnShouldStartLoadWithRequest,
  WebViewError,
  WebViewHttpError,
  WebViewNavigation,
} from 'react-native-webview/lib/WebViewTypes';

import { countMetric } from '@app/lib/sentry';
import { theme } from '@app/styles/themes';
import { logger } from '@app/utils/logger';

import { PIP_ENABLED } from './util/pipFeature';
import { isAppUrl } from './util/twitch-player-source/isAppUrl';
import { isTwitchPassportCallbackUrl } from './util/twitch-player-source/isTwitchPassportCallbackUrl';

type WebViewSource = NonNullable<WebViewProps['source']>;
type WebViewHandle = InstanceType<typeof WebView>;

const handleShouldStartLoadWithRequest: OnShouldStartLoadWithRequest =
  request => !isAppUrl(request.url);

interface StreamPlayerWebViewProps {
  allowsTwitchInteraction: boolean;
  channel?: string;
  clip?: string;
  injectedJavaScript?: string;
  injectedJavaScriptBeforeContentLoaded?: string;
  onHttpError: (error: { statusCode: number; url: string }) => void;
  onLoadFailed?: (
    reason: string,
    error: WebViewError | WebViewHttpError,
  ) => void;
  onMessage: WebViewProps['onMessage'];
  onWebViewLoaded?: () => void;
  // When false the WebView is transparent (non-opaque WKWebView), so the iOS rotation snapshot
  // reveals the thumbnail behind it instead of the WebView's black backing.
  opaque?: boolean;
  remountWebView: () => void;
  scheduleAuthCompletionReload: () => void;
  source: WebViewSource;
  video?: string;
  webViewKey: number;
  webViewRef: RefObject<WebViewHandle | null>;
}

export const StreamPlayerWebView = memo(function StreamPlayerWebView({
  allowsTwitchInteraction,
  channel,
  clip,
  injectedJavaScript,
  injectedJavaScriptBeforeContentLoaded,
  onHttpError,
  onLoadFailed,
  onMessage,
  onWebViewLoaded,
  opaque = true,
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
    }
  };

  const handleWebViewError = (event: { nativeEvent: WebViewError }) => {
    const { nativeEvent } = event;
    onLoadFailed?.('webview_error', nativeEvent);
  };

  const handleWebViewHttpError = (event: { nativeEvent: WebViewHttpError }) => {
    const { nativeEvent } = event;

    onHttpError({
      url: nativeEvent.url,
      statusCode: nativeEvent.statusCode,
    });

    onLoadFailed?.(`http_${nativeEvent.statusCode}`, nativeEvent);
  };

  // Under memory pressure WKWebView kills its content process and Android
  // kills its render process. The player then stays black until a remount.
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

  const handleLoadStart = () => {
    logger.main.debug('[StreamPlayer:WebView] onLoadStart', {
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
      allowsPictureInPictureMediaPlayback={PIP_ENABLED}
      cacheEnabled
      domStorageEnabled
      javaScriptEnabled
      javaScriptCanOpenWindowsAutomatically
      mediaPlaybackRequiresUserAction={false}
      mixedContentMode='never'
      nestedScrollEnabled={false}
      overScrollMode='never'
      // When foam draws its own controls, ignore touches so WKWebView's gesture recognisers
      // don't delay the overlay's tap.
      pointerEvents={allowsTwitchInteraction ? 'auto' : 'none'}
      scrollEnabled={allowsTwitchInteraction}
      // Baked into the WKWebView config at creation, so these can't track the
      // live allowsTwitchInteraction. Kept permissive so the content gate's
      // login form is typeable; pointerEvents='none' keeps playback inert.
      keyboardDisplayRequiresUserAction={false}
      setBuiltInZoomControls={false}
      setDisplayZoomControls={false}
      setSupportMultipleWindows={false}
      sharedCookiesEnabled
      thirdPartyCookiesEnabled
      textInteractionEnabled
      originWhitelist={['*']}
      {...{
        source,
        injectedJavaScript,
        injectedJavaScriptBeforeContentLoaded,
        onMessage,
      }}
      injectedJavaScriptBeforeContentLoadedForMainFrameOnly={false}
      injectedJavaScriptForMainFrameOnly={false}
      style={[
        styles.webView,
        allowsTwitchInteraction && styles.webViewScrollable,
        !opaque && styles.webViewTransparent,
      ]}
      onContentProcessDidTerminate={() =>
        handleWebViewProcessGone('content_process_terminated')
      }
      onError={handleWebViewError}
      onHttpError={handleWebViewHttpError}
      onNavigationStateChange={(event: WebViewNavigation) => {
        if (isTwitchPassportCallbackUrl(event.url)) {
          scheduleAuthCompletionReload();
        }
      }}
      onShouldStartLoadWithRequest={handleShouldStartLoadWithRequest}
      onLoadEnd={(event: { nativeEvent: { url: string } }) =>
        handleLoadEnd(event.nativeEvent.url)
      }
      onLoadStart={handleLoadStart}
      onRenderProcessGone={() =>
        handleWebViewProcessGone('render_process_gone')
      }
    />
  );
});

const styles = StyleSheet.create({
  webView: {
    backgroundColor: theme.colorBlack,
    flex: 1,
    height: '100%',
    width: '100%',
  },
  webViewScrollable: {
    minHeight: '100%',
  },
  webViewTransparent: {
    backgroundColor: 'transparent',
  },
});
