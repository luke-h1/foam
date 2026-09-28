import { Platform } from 'react-native';

import { PIP_ENABLED } from '../pip-feature';
import { buildTwitchAutoplayEnsureScript } from './build-twitch-autoplay-ensure-script';
import { buildTwitchCaptionHiderScript } from './build-twitch-caption-hider-script';
import { buildTwitchChromeHiderScript } from './build-twitch-chrome-hider-script';
import { buildTwitchContentGateAcceptScript } from './build-twitch-content-gate-accept-script';
import { buildTwitchContentGateWatcherScript } from './build-twitch-content-gate-watcher-script';
import { buildTwitchEmbedErrorWatcherScript } from './build-twitch-embed-error-watcher-script';
import { buildTwitchLatencyTrackerScript } from './build-twitch-latency-tracker-script';
import { buildTwitchLiveSyncScript } from './build-twitch-live-sync-script';
import { buildTwitchPipBridgeScript } from './build-twitch-pip-bridge-script';
import { buildTwitchPlayerStateScript } from './build-twitch-player-state-script';

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

interface BuildStreamPlayerInjectedJavaScriptOptions {
  autoplay: boolean;
  clip: string | undefined;
  initialMuted: boolean;
  showOverlayControls: boolean;
  video: string | undefined;
}

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
}: BuildStreamPlayerInjectedJavaScriptOptions): string {
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
