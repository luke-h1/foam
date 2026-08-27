import { Platform } from 'react-native';

import { PIP_ENABLED } from '../pipFeature';
import { buildTwitchAutoplayEnsureScript } from './buildTwitchAutoplayEnsureScript';
import { buildTwitchCaptionHiderScript } from './buildTwitchCaptionHiderScript';
import { buildTwitchChromeHiderScript } from './buildTwitchChromeHiderScript';
import { buildTwitchContentGateAcceptScript } from './buildTwitchContentGateAcceptScript';
import { buildTwitchContentGateWatcherScript } from './buildTwitchContentGateWatcherScript';
import { buildTwitchEmbedErrorWatcherScript } from './buildTwitchEmbedErrorWatcherScript';
import { buildTwitchLatencyTrackerScript } from './buildTwitchLatencyTrackerScript';
import { buildTwitchLiveSyncScript } from './buildTwitchLiveSyncScript';
import { buildTwitchPipBridgeScript } from './buildTwitchPipBridgeScript';
import { buildTwitchPlayerStateScript } from './buildTwitchPlayerStateScript';

/**
 * Rewrites `window.open` so the Twitch login popup lands in the same WebView,
 * then detects the page Twitch redirects to on successful auth.
 */
export function buildTwitchAuthHelperScript(): string {
  return TWITCH_AUTH_HELPER_SCRIPT;
}

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
 * Polls the VOD <video> position and reports it to native so the last-known
 * offset survives a WebView reload; observe-only, never fights user seeks.
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
 * Scripts injected after content loads. Text tracks are set 'hidden', not
 * 'disabled', which stalls WKWebView's native HLS AVPlayer.
 */
export function buildStreamPlayerInjectedJavaScript({
  autoplay,
  clip,
  initialMuted,
  showOverlayControls,
  video,
}: {
  autoplay: boolean;
  clip: string | undefined;
  initialMuted: boolean;
  showOverlayControls: boolean;
  video: string | undefined;
}): string {
  return (
    TWITCH_AUTH_HELPER_SCRIPT +
    '\n' +
    // Bad-parent "embed is misconfigured" pages report to Sentry instead of
    // only timing out.
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
      : '')
  );
}
