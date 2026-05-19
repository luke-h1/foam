import { Button } from '@app/components/Button/Button';
import { Icon } from '@app/components/Icon/Icon';
import { PressableArea } from '@app/components/PressableArea/PressableArea';
import { Text } from '@app/components/ui/Text/Text';
import { impact } from '@app/lib/haptics';
import { countMetric } from '@app/lib/sentry';
import { recordError } from '@app/lib/sentry';
import { theme } from '@app/styles/themes';
import { LinearGradient } from 'expo-linear-gradient';
import {
  forwardRef,
  memo,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  AppState,
  type AppStateStatus,
  type DimensionValue,
  Platform,
  View,
  StyleSheet,
} from 'react-native';
import {
  Directions,
  Gesture,
  GestureDetector,
} from 'react-native-gesture-handler';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import type {
  OnShouldStartLoadWithRequest,
  WebViewError,
  WebViewHttpError,
} from 'react-native-webview/lib/WebViewTypes';
import { scheduleOnRN } from 'react-native-worklets';
import { streamWebViewWarmupPool } from './WebViewWarmupPool';

const TWITCH_PLAYER_WEBSITE_URL = (
  process.env.EXPO_PUBLIC_TWITCH_PLAYER_WEBSITE_URL ??
  process.env.EXPO_PUBLIC_PLAYER_URL
)?.trim();

export interface StreamPlayerRef {
  /**
   * Force refresh the player (hard reload)
   */
  forceRefresh: () => void;
  /**
   * Get the current channel name
   */
  getChannel: () => string | undefined;
  /**
   * Get the current playback time in seconds
   */
  getCurrentTime: () => Promise<number>;
  /**
   * Get the total duration in seconds (VODs only)
   */
  getDuration: () => Promise<number>;
  /**
   * Get the current muted state
   */
  getMuted: () => boolean;
  /**
   * Get the current paused state
   */
  getPaused: () => boolean;
  /**
   * Get the current volume (0-1)
   */
  getVolume: () => number;
  /**
   * Mute the player
   */
  mute: () => void;
  /**
   * Pause playback
   */
  pause: () => void;
  /**
   * Start or resume playback
   */
  play: () => void;
  /**
   * Seek to a specific timestamp in seconds (VODs only)
   */
  seek: (timestamp: number) => void;
  /**
   * Switch to a different channel
   */
  setChannel: (channel: string) => void;
  /**
   * Set the muted state
   */
  setMuted: (muted: boolean) => void;
  /**
   * Set the video quality
   */
  setQuality: (quality: string) => void;
  /**
   * Play a specific VOD
   * @param videoId - The VOD ID
   * @param timestamp - Optional start time in seconds
   */
  setVideo: (videoId: string, timestamp?: number) => void;
  /**
   * Set the volume level
   * @param volume - Volume level between 0 and 1
   */
  setVolume: (volume: number) => void;
  /**
   * Unmute the player
   */
  unmute: () => void;
}

export interface StreamInfo {
  /**
   * Game/category name being played
   */
  gameName?: string;
  /**
   * URL to the streamer's avatar image
   */
  profileImageUrl?: string;
  /**
   * Stream start time (ISO string) for calculating duration
   */
  startedAt?: string;
  /**
   * Stream title
   */
  title?: string;
  /**
   * Streamer's display name
   */
  userName?: string;
  /**
   * Streamer's login/username
   */
  userLogin?: string;
  /**
   * Current viewer count
   */
  viewerCount?: number;
}

export interface StreamPlayerProps {
  /**
   * Enable autoplay
   * @default true
   */
  autoplay?: boolean;
  /**
   * Twitch channel name
   */
  channel?: string;

  /**
   * Height of the player
   */
  height?: DimensionValue;

  deferOverlayUntilUserUnmute?: boolean;
  /**
   * Initial muted state
   * @default false
   */
  muted?: boolean;
  /**
   * Callback when back button is pressed
   */
  onBackPress?: () => void;
  /**
   * Callback when content gate (e.g. login required) is detected or dismissed
   */
  onContentGateChange?: (hasGate: boolean) => void;
  /**
   * Callback when the stream ends
   */
  onEnded?: () => void;
  /**
   * Callback when an error occurs
   */
  onError?: (error: string) => void;
  /**
   * Callback when the stream goes offline
   */
  onOffline?: () => void;
  /**
   * Callback when the stream goes online
   */
  onOnline?: () => void;
  /**
   * Callback when the stream pauses
   */
  onPause?: () => void;
  /**
   * Callback with Twitch's reported latency from broadcaster to viewer.
   */
  onPlaybackLatencyChange?: (latencySeconds: number) => void;
  /**
   * Callback when the stream plays
   */
  onPlay?: () => void;
  /**
   * Callback when the player is ready
   */
  onReady?: () => void;
  /**
   * Callback when refresh is pressed
   */
  onRefresh?: () => void;
  /**
   * Optional callback when the user taps the video area (e.g. to toggle chat in landscape).
   */
  onVideoAreaPress?: () => void;
  /**
   * Optional callback when the user swipes down on the video area.
   */
  onVideoAreaSwipeDown?: () => void;
  /**
   * Callback when the embed WebView has finished loading. Use to sync IRC connections (only after player is ready).
   */
  onWebViewLoaded?: () => void;
  /**
   * Parent domain for Twitch embed. Must be an HTTPS domain you added in the
   * Twitch Developer Console (e.g. foam-app.com). We send Referer/Origin so Twitch validates.
   * @default 'foam-app.com'
   */
  parent?: string;
  /**
   * Base URL for stream proxy (e.g. http://localhost:4000).
   * When set, WebView loads Twitch embed via proxy instead of direct player URL.
   */
  streamProxyBaseUrl?: string;
  /**
   * Experiment: restrict top-level WebView navigations to Twitch player/auth URLs.
   */
  restrictWebViewNavigationToTwitchPlayer?: boolean;
  /**
   * Load player.twitch.tv directly instead of generated embed HTML.
   * This disables the JS player bridge but allows Twitch's own login/cookie UI
   * to handle scrolling and interaction.
   * @default true
   */
  useRawTwitchPlayer?: boolean;
  /**
   * Show custom overlay controls
   * @default true
   */
  showOverlayControls?: boolean;
  /**
   * Stream information for the overlay
   */
  streamInfo?: StreamInfo;
  /**
   * VOD ID to play
   */
  video?: string;
  /**
   * Width of the player
   */
  width?: DimensionValue;
}

interface PlayerState {
  channel?: string;
  currentTime: number;
  duration: number;
  isPaused: boolean;
  muted: boolean;
  quality: string;
  volume: number;
}

interface PlayerStatusState {
  isBuffering: boolean;
  isReady: boolean;
}

interface PlayerStateUpdatePayload {
  isBuffering: boolean;
  isPaused: boolean;
  isReady: boolean;
  muted: boolean;
  volume: number;
}

interface PlaybackStatsPayload {
  bufferSize?: number;
  displayResolution?: string;
  fps?: number;
  hlsLatencyBroadcaster?: number | null;
  playbackRate?: number;
  skippedFrames?: number;
  videoResolution?: string;
}

type PlayerMessage =
  | { payload: { message: string }; type: 'error' }
  | { payload: { time: number }; type: 'currentTime' }
  | { payload: { duration: number }; type: 'duration' }
  | { payload: PlayerStateUpdatePayload; type: 'stateUpdate' }
  | { payload: PlaybackStatsPayload; type: 'playbackStats' }
  | {
      payload: {
        currentTime: number;
        networkState: number;
        paused: boolean;
        readyState: number;
      };
      type: 'healthCheck';
    }
  | { payload: { hasContentGate: boolean }; type: 'contentGateDetected' }
  | {
      payload: {
        hasGate: boolean;
        gateText: string;
        hasAuthToken: boolean;
        hasAuthHyphen: boolean;
        cookieCount: number;
        href: string;
      };
      type: 'debugLog';
    }
  | { type: 'ended' }
  | { type: 'offline' }
  | { type: 'online' }
  | { type: 'pause' }
  | { type: 'play' }
  | { type: 'playbackBlocked' }
  | { type: 'playing' }
  | { type: 'ready' }
  | { type: 'trace'; payload: { step: string; detail?: string } }
  | { type: 'twitchAuthComplete' }
  | { type: 'error'; payload: { message: string } }
  | { type: 'muteState'; payload: { muted: boolean; volume: number } };

const TWITCH_PLAYER_ALLOWED_NAVIGATION_PREFIXES = [
  'about:blank',
  'https://id.twitch.tv/',
  'https://www.twitch.tv/passport-callback',
  'https://player.twitch.tv/',
];

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

export function isAllowedTwitchPlayerNavigation(
  url: string,
  parent: string,
  playerWebsiteUrl?: string,
): boolean {
  if (!url) {
    return false;
  }

  const normalizedParent = parent.trim().toLowerCase();
  const parentBaseUrl = normalizedParent
    ? `https://${normalizedParent}/`
    : null;
  const playerWebsiteBaseUrl = playerWebsiteUrl
    ? getBaseUrl(playerWebsiteUrl)
    : null;

  return (
    TWITCH_PLAYER_ALLOWED_NAVIGATION_PREFIXES.some(prefix =>
      url.startsWith(prefix),
    ) ||
    (parentBaseUrl != null && url.startsWith(parentBaseUrl)) ||
    (playerWebsiteBaseUrl != null && url.startsWith(playerWebsiteBaseUrl))
  );
}

function getBaseUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    return `${parsed.protocol}//${parsed.host}/`;
  } catch {
    return null;
  }
}

export function buildHostedTwitchPlayerUrl(options: {
  autoplay: boolean;
  channel: string;
  debug: boolean;
  muted: boolean;
  playerWebsiteUrl?: string;
  video?: string;
}): string | null {
  if (!options.playerWebsiteUrl) {
    return null;
  }

  try {
    const url = new URL(options.playerWebsiteUrl);
    url.searchParams.set('autoplay', options.autoplay ? 'true' : 'false');
    url.searchParams.set('muted', options.muted ? 'true' : 'false');
    url.searchParams.set('debug', options.debug ? 'true' : 'false');

    if (options.video) {
      url.searchParams.set('video', options.video);
      url.searchParams.delete('channel');
    } else {
      url.searchParams.set('channel', options.channel);
      url.searchParams.delete('video');
    }

    return url.toString();
  } catch {
    return null;
  }
}

function buildTwitchEmbedHtml(options: {
  channel: string;
  video?: string;
  parent: string;
  autoplay: boolean;
  muted: boolean;
  debug: boolean;
  width: number | string;
  height: number | string;
}): string {
  const { channel, video, parent, autoplay, muted, debug, width, height } =
    options;
  const safeChannel = channel.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  const safeParent = parent.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  const widthPx = typeof width === 'number' ? `${width}px` : width;
  const heightPx = typeof height === 'number' ? `${height}px` : height;

  // Prevent Twitch's native overlay from rendering above Foam's controls.
  return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
  <link rel="dns-prefetch" href="//embed.twitch.tv">
  <link rel="preconnect" href="https://embed.twitch.tv" crossorigin>
  <link rel="preconnect" href="https://static.twitchcdn.net" crossorigin>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body {
      width: 100%;
      height: 100%;
      min-height: 100%;
      overflow-x: hidden;
      overflow-y: auto;
      -webkit-overflow-scrolling: touch;
      background: #000;
    }
    #twitch-player { width: 100%; height: 100%; }
    .player-controls,
    #channel-player-disclosures,
    [data-a-target="player-overlay-preview-background"],
    [data-a-target="player-overlay-video-stats"],
    [data-a-target="player-overlay-play-button"],
    [data-a-target="player-overlay-click-handler"],
    .player-overlay-background {
      display: none !important;
      visibility: hidden !important;
      pointer-events: none !important;
    }
  </style>
</head>
<body>
  <div id="twitch-player" style="width:${widthPx};height:${heightPx};"></div>
  <script>
    var enableTrace = ${debug ? 'true' : 'false'};
    var initialMuted = ${muted ? 'true' : 'false'};
    function post(type, payload) {
      if (type === 'trace' && !enableTrace) {
        return;
      }
      try {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: type, payload: payload || {} }));
      } catch (e) {}
    }
    post('trace', { step: 'html_parsed', detail: 'inline script running' });
    function initPlayer() {
      post('trace', { step: 'embed_script_loaded', detail: 'Twitch embed v1.js loaded' });
      try {
        if (typeof Twitch === 'undefined') {
          post('error', { message: 'Twitch is undefined after script load' });
          return;
        }
        post('trace', { step: 'creating_player', detail: 'channel=${safeChannel}' });
        var embedOpts = {
          width: '100%',
          height: '100%',
          parent: ['${safeParent}'],
          autoplay: ${autoplay},
          muted: ${muted}
        };
        ${video ? `embedOpts.video = '${video.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}';` : `embedOpts.channel = '${safeChannel}';`}
        var player = new Twitch.Player('twitch-player', embedOpts);
        post('trace', { step: 'player_created', detail: 'Twitch.Player instance created' });
        window._twitchPlayer = player;
        function emitMuteState() {
          post('muteState', {
            muted: player.getMuted(),
            volume: player.getVolume()
          });
        }
        function disableCaptions() {
          try {
            if (typeof player.disableCaptions === 'function') {
              player.disableCaptions();
            }
          } catch (e) {}
        }
        function emitPlaybackStats() {
          try {
            if (typeof player.getPlaybackStats !== 'function') {
              return;
            }
            var stats = player.getPlaybackStats();
            if (!stats) {
              return;
            }
            post('playbackStats', {
              bufferSize: stats.bufferSize,
              displayResolution: stats.displayResolution,
              fps: stats.fps,
              hlsLatencyBroadcaster:
                typeof stats.hlsLatencyBroadcaster === 'number'
                  ? stats.hlsLatencyBroadcaster
                  : null,
              playbackRate: stats.playbackRate,
              skippedFrames: stats.skippedFrames,
              videoResolution: stats.videoResolution
            });
          } catch (e) {}
        }
        var playbackStatsInterval = null;
        var lastBlockedEventAt = 0;
        function startPlaybackStats() {
          emitPlaybackStats();
          if (playbackStatsInterval) {
            return;
          }
          playbackStatsInterval = setInterval(emitPlaybackStats, 1000);
        }
        function stopPlaybackStats() {
          if (!playbackStatsInterval) {
            return;
          }
          clearInterval(playbackStatsInterval);
          playbackStatsInterval = null;
        }
        player.addEventListener(Twitch.Player.READY, function() {
          disableCaptions();
          post('ready');
          emitMuteState();
          startPlaybackStats();
          if (!initialMuted && player.getMuted()) {
            var unmuteDeadline = Date.now() + 5000;
            var unmuteTick = setInterval(function() {
              var el = null;
              try {
                var nodes = document.querySelectorAll('button, a, [role=button], [class*="unmute"], [class*="Unmute"]');
                for (var i = 0; i < nodes.length; i++) {
                  var t = (nodes[i].textContent || '').toLowerCase();
                  if (t.indexOf('click to unmute') !== -1) { el = nodes[i]; break; }
                }
              } catch (e) {}
              if (el) {
                clearInterval(unmuteTick);
                el.click();
                player.setMuted(false);
                player.setVolume(1);
              } else if (Date.now() > unmuteDeadline) {
                clearInterval(unmuteTick);
                player.setMuted(false);
                player.setVolume(1);
              }
            }, 100);
          }
        });
        var pendingPauseTimer = null;
        function clearPendingPause() {
          if (!pendingPauseTimer) {
            return;
          }
          clearTimeout(pendingPauseTimer);
          pendingPauseTimer = null;
        }
        function postPauseIfStillPaused() {
          pendingPauseTimer = null;
          try {
            if (typeof player.isPaused === 'function' && !player.isPaused()) {
              return;
            }
          } catch (e) {}
          post('pause');
        }
        function postPlaybackBlocked() {
          var now = Date.now();
          if (now - lastBlockedEventAt < 2000) {
            return;
          }
          lastBlockedEventAt = now;
          post('playbackBlocked');
        }
        player.addEventListener(Twitch.Player.PLAY, function() {
          clearPendingPause();
          post('play');
        });
        player.addEventListener(Twitch.Player.PAUSE, function() {
          clearPendingPause();
          pendingPauseTimer = setTimeout(postPauseIfStillPaused, 750);
        });
        player.addEventListener(Twitch.Player.PLAYBACK_BLOCKED, function() {
          postPlaybackBlocked();
        });
        player.addEventListener(Twitch.Player.CAPTIONS, function() {
          disableCaptions();
        });
        player.addEventListener(Twitch.Player.PLAYING, function() {
          clearPendingPause();
          disableCaptions();
          post('playing');
          post('stateUpdate', {
            isBuffering: false,
            isPaused: false,
            isReady: true,
            muted: player.getMuted(),
            volume: player.getVolume()
          });
          startPlaybackStats();
        });
        player.addEventListener(Twitch.Player.ENDED, function() { stopPlaybackStats(); post('ended'); });
        player.addEventListener(Twitch.Player.OFFLINE, function() { post('offline'); });
        player.addEventListener(Twitch.Player.ONLINE, function() { post('online'); });
        window.playerControls = {
          play: function() { player.play(); },
          pause: function() { player.pause(); },
          mute: function() { player.setMuted(true); emitMuteState(); },
          setMuted: function(m) { player.setMuted(m); emitMuteState(); },
          unmute: function() { player.setMuted(false); player.setVolume(1); emitMuteState(); },
          setVolume: function(v) { player.setVolume(v); if (v > 0) { player.setMuted(false); } emitMuteState(); },
          getCurrentTime: function() { post('currentTime', { time: player.getCurrentTime() }); },
          getDuration: function() { post('duration', { duration: player.getDuration() }); },
          seek: function(t) { player.seek(t); },
          setChannel: function(c) { player.setChannel(c); },
          setVideo: function(v, t) { player.setVideo(v, t || 0); },
          setQuality: function(q) { player.setQuality(q); },
          seekToLive: function() {}
        };
        post('trace', { step: 'player_ready', detail: 'listeners and controls attached' });
      } catch (e) {
        post('error', { message: 'initPlayer: ' + (e.message || String(e)) });
      }
    }
    var embedScript = document.createElement('script');
    embedScript.src = 'https://embed.twitch.tv/embed/v1.js';
    embedScript.onload = function() { initPlayer(); };
    embedScript.onerror = function() {
      post('error', { message: 'Failed to load embed.twitch.tv/embed/v1.js' });
    };
    post('trace', { step: 'loading_embed_script', detail: 'fetching v1.js' });
    document.head.appendChild(embedScript);
    setTimeout(function() {
      if (!window._twitchPlayer && !window.__traceInitTimeout) {
        window.__traceInitTimeout = true;
        post('trace', { step: 'timeout_10s', detail: 'Twitch player not ready after 10s' });
      }
    }, 10000);
  </script>
</body>
</html>`;
}

export function buildRawTwitchPlayerUrl(options: {
  autoplay: boolean;
  channel: string;
  muted: boolean;
  parent: string;
  video?: string;
}): string {
  const params = new URLSearchParams({
    autoplay: options.autoplay ? 'true' : 'false',
    muted: options.muted ? 'true' : 'false',
    parent: options.parent,
  });

  if (options.video) {
    params.set('video', options.video);
  } else {
    params.set('channel', options.channel);
  }

  return `https://player.twitch.tv/?${params.toString()}`;
}

export function isAppUrl(url: string): boolean {
  return url.startsWith('foam://') || url.startsWith('exp+foam://');
}

export function isTwitchPassportCallbackUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (
      parsed.hostname === 'www.twitch.tv' &&
      parsed.pathname.startsWith('/passport-callback')
    );
  } catch {
    return false;
  }
}

interface ControlsOverlayProps {
  isVisible: boolean;
  latencySeconds?: number | null;
  onBackPress?: () => void;
  onPipPress?: () => void;
  onPlayPausePress: () => void;
  onRefresh?: () => void;
  onToggleControls: () => void;
  paused: boolean;
  showPip?: boolean;
  streamInfo?: StreamInfo;
}

interface OverlayMetricsState {
  duration: string;
}

export function formatDuration(startedAt?: string): string {
  if (!startedAt) {
    return '0:00';
  }
  const start = new Date(startedAt).getTime();
  const now = Date.now();
  const seconds = Math.floor((now - start) / 1000);

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

function formatViewerCount(count?: number): string {
  if (!count) {
    return '0';
  }
  return count.toLocaleString();
}

function ControlsOverlay({
  isVisible,
  latencySeconds,
  onBackPress,
  onPipPress,
  onPlayPausePress,
  onRefresh,
  onToggleControls,
  paused,
  showPip = Platform.OS === 'ios',
  streamInfo,
}: ControlsOverlayProps) {
  const insets = useSafeAreaInsets();
  const opacity = useSharedValue(0);
  const [metrics, setMetrics] = useState<OverlayMetricsState>(() => ({
    duration: formatDuration(streamInfo?.startedAt),
  }));

  useEffect(() => {
    if (!isVisible || !streamInfo?.startedAt) {
      return;
    }

    const updateDuration = () => {
      const nextDuration = formatDuration(streamInfo.startedAt);
      setMetrics(previous =>
        previous.duration === nextDuration
          ? previous
          : {
              ...previous,
              duration: nextDuration,
            },
      );
    };

    updateDuration();

    const interval = setInterval(updateDuration, 1000);
    return () => clearInterval(interval);
  }, [isVisible, streamInfo?.startedAt]);

  useEffect(() => {
    if (streamInfo?.startedAt) {
      return;
    }

    setMetrics(previous =>
      previous.duration === '0:00'
        ? previous
        : {
            ...previous,
            duration: '0:00',
          },
    );
  }, [streamInfo?.startedAt]);

  useEffect(() => {
    opacity.value = withTiming(isVisible ? 1 : 0, {
      duration: 200,
      easing: Easing.ease,
    });
  }, [isVisible, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    pointerEvents: opacity.value > 0.5 ? 'auto' : 'none',
  }));

  const overlayTapGesture = useMemo(
    () =>
      Gesture.Tap().onEnd(() => {
        'worklet';

        scheduleOnRN(onToggleControls);
      }),
    [onToggleControls],
  );

  return (
    <Animated.View style={[styles.controlsOverlay, animatedStyle]}>
      <GestureDetector gesture={overlayTapGesture}>
        <View style={styles.overlayTapTarget} />
      </GestureDetector>

      <View
        pointerEvents="none"
        style={[styles.latencyBadge, { top: insets.top + theme.space12 }]}
      >
        <Icon
          color={theme.colorWhite}
          icon="clock"
          size={12}
          style={styles.latencyBadgeIcon}
        />
        <Text style={styles.latencyBadgeText}>
          {latencySeconds == null ? '--' : `${latencySeconds.toFixed(1)}s`}
        </Text>
      </View>

      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        {onBackPress && (
          <View style={styles.headerButtonContainer}>
            <Button
              label="Back"
              style={styles.headerButton}
              onPress={onBackPress}
            >
              <Icon color={theme.colorWhite} icon="chevron-left" size={24} />
            </Button>
          </View>
        )}

        <View style={styles.spacer} />
      </View>

      <View style={styles.centerControls}>
        <Button
          label={paused ? 'Play' : 'Pause'}
          style={styles.playPauseButton}
          onPress={onPlayPausePress}
        >
          <Icon
            color={theme.colorWhite}
            icon={paused ? 'play' : 'pause'}
            size={40}
          />
        </Button>
      </View>

      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.85)']}
        style={styles.bottomGradient}
        pointerEvents="none"
      />

      <View
        style={[styles.bottomControls, { paddingBottom: insets.bottom + 12 }]}
      >
        <View style={styles.streamMetadataRow}>
          <View style={styles.liveIndicator}>
            <View style={styles.liveDot} />
            <Text style={styles.durationText}>{metrics.duration}</Text>
          </View>
          <Text numberOfLines={1} style={styles.streamerNameBottom}>
            {streamInfo?.userName || streamInfo?.userLogin || ''}
          </Text>
          <View style={styles.viewerCountRow}>
            <Icon icon="user" size={14} style={styles.userIcon} />
            <Text style={styles.viewerCountText}>
              {formatViewerCount(streamInfo?.viewerCount)}
            </Text>
          </View>
        </View>

        <View style={styles.spacer} />
        {onRefresh && (
          <View style={styles.controlButtonContainer}>
            <Button
              label="Refresh"
              style={styles.controlButton}
              onPress={onRefresh}
            >
              <Icon color={theme.colorWhite} icon="refresh-cw" size={18} />
            </Button>
          </View>
        )}

        {showPip && onPipPress && (
          <View style={styles.controlButtonContainer}>
            <Button
              label="Picture in Picture"
              style={styles.controlButton}
              onPress={onPipPress}
            >
              <Icon
                color={theme.colorWhite}
                icon="picture-in-picture-bottom-right"
                iconFamily="MaterialCommunityIcons"
                size={20}
              />
            </Button>
          </View>
        )}
      </View>
    </Animated.View>
  );
}

export const StreamPlayer = memo(
  forwardRef<StreamPlayerRef, StreamPlayerProps>(function StreamPlayer(
    {
      autoplay = true,
      channel,
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
      video,
      width,
    },
    ref,
  ) {
    const insets = useSafeAreaInsets();
    const webViewRef = useRef<WebView>(null);
    const needsInitRef = useRef(true);

    const [playerState, setPlayerState] = useState<PlayerState>({
      channel,
      currentTime: 0,
      duration: 0,
      isPaused: !autoplay,
      muted: initialMuted,
      quality: 'auto',
      volume: 1,
    });
    const [playerStatus, setPlayerStatus] = useState<PlayerStatusState>({
      isBuffering: true,
      isReady: false,
    });
    const authCompletionReloadTimeoutRef = useRef<ReturnType<
      typeof setTimeout
    > | null>(null);

    const [controlsVisible, setControlsVisible] = useState(false);
    const controlsVisibleRef = useRef(false);
    const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
      null,
    );
    const [playbackLatencySeconds, setPlaybackLatencySeconds] = useState<
      number | null
    >(null);
    const [hasContentGate, setHasContentGate] = useState(false);
    const [overlayUnlocked, setOverlayUnlocked] = useState(false);
    const [webViewKey, setWebViewKey] = useState(0);
    const usesHostedPlayer =
      !useRawTwitchPlayer && Boolean(TWITCH_PLAYER_WEBSITE_URL);

    useEffect(() => {
      setPlaybackLatencySeconds(null);
      setOverlayUnlocked(false);
      needsInitRef.current = true;
    }, [channel, video]);
    useEffect(() => {
      onContentGateChange?.(hasContentGate);
    }, [hasContentGate, onContentGateChange]);

    const [lastHttpError, setLastHttpError] = useState<{
      url: string;
      statusCode: number;
    } | null>(null);

    // For stuck-detection health check (injected JS)
    const lastVideoTimeRef = useRef<number>(-1);
    const stuckCountRef = useRef<number>(0);
    const appStateRef = useRef<AppStateStatus>(AppState.currentState);

    // Avoid WebView.reload(): with source={{ html, baseUrl: https://www.twitch.tv/ }} it loads twitch.tv, not the embed HTML (issue #524).
    const remountEmbedWebView = useCallback(() => {
      setPlayerStatus({
        isReady: false,
        isBuffering: true,
      });
      needsInitRef.current = true;
      setWebViewKey(k => k + 1);
    }, []);

    const forceRefresh = remountEmbedWebView;

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
      const handleAppStateChange = (nextAppState: AppStateStatus) => {
        if (appStateRef.current === 'background' && nextAppState === 'active') {
          remountEmbedWebView();
        }

        appStateRef.current = nextAppState;
      };

      const subscription = AppState.addEventListener(
        'change',
        handleAppStateChange,
      );

      return () => {
        subscription.remove();
        if (authCompletionReloadTimeoutRef.current) {
          clearTimeout(authCompletionReloadTimeoutRef.current);
          authCompletionReloadTimeoutRef.current = null;
        }
      };
    }, [remountEmbedWebView]);

    useEffect(() => {
      streamWebViewWarmupPool.startWarmup(parent);
    }, [parent]);

    // Reset stuck-detection refs when not ready or paused
    useEffect(() => {
      if (!playerStatus.isReady || playerState.isPaused) {
        lastVideoTimeRef.current = -1;
        stuckCountRef.current = 0;
      }
    }, [playerStatus.isReady, playerState.isPaused]);

    const currentTimeResolverRef = useRef<((value: number) => void) | null>(
      null,
    );
    const durationResolverRef = useRef<((value: number) => void) | null>(null);

    const injectJS = useCallback((script: string) => {
      webViewRef.current?.injectJavaScript(
        `try { ${script} } catch(e) {}; true;`,
      );
    }, []);

    const play = useCallback(() => {
      injectJS('window.playerControls.play()');
    }, [injectJS]);

    const pause = useCallback(() => {
      injectJS('window.playerControls.pause()');
    }, [injectJS]);

    const mute = useCallback(() => {
      injectJS('window.playerControls.mute()');
    }, [injectJS]);

    const unmute = useCallback(() => {
      injectJS('window.playerControls.unmute()');
    }, [injectJS]);

    const setMuted = useCallback(
      (muted: boolean) => {
        injectJS(`window.playerControls.setMuted(${muted})`);
      },
      [injectJS],
    );

    const setVolume = useCallback(
      (volume: number) => {
        injectJS(`window.playerControls.setVolume(${volume})`);
      },
      [injectJS],
    );

    const setChannel = useCallback(
      (newChannel: string) => {
        injectJS(`window.playerControls.setChannel('${newChannel}')`);
      },
      [injectJS],
    );

    const setVideo = useCallback(
      (videoId: string, timestamp?: number) => {
        injectJS(
          `window.playerControls.setVideo('${videoId}', ${timestamp ?? 0})`,
        );
      },
      [injectJS],
    );

    const setQuality = useCallback(
      (quality: string) => {
        injectJS(`window.playerControls.setQuality('${quality}')`);
      },
      [injectJS],
    );

    const seek = useCallback(
      (timestamp: number) => {
        injectJS(`window.playerControls.seek(${timestamp})`);
      },
      [injectJS],
    );

    const getCurrentTime = useCallback((): Promise<number> => {
      return new Promise(resolve => {
        currentTimeResolverRef.current = resolve;
        injectJS('window.playerControls.getCurrentTime()');

        setTimeout(() => {
          if (currentTimeResolverRef.current) {
            currentTimeResolverRef.current(playerState.currentTime);
            currentTimeResolverRef.current = null;
          }
        }, 1000);
      });
    }, [injectJS, playerState.currentTime]);

    const getDuration = useCallback((): Promise<number> => {
      return new Promise(resolve => {
        durationResolverRef.current = resolve;
        injectJS('window.playerControls.getDuration()');

        setTimeout(() => {
          if (durationResolverRef.current) {
            durationResolverRef.current(playerState.duration);
            durationResolverRef.current = null;
          }
        }, 1000);
      });
    }, [injectJS, playerState.duration]);

    useImperativeHandle(
      ref,
      () => ({
        forceRefresh,
        getChannel: () => playerState.channel,
        getCurrentTime,
        getDuration,
        getMuted: () => playerState.muted,
        getPaused: () => playerState.isPaused,
        getVolume: () => playerState.volume,
        mute,
        pause,
        play,
        seek,
        setChannel,
        setMuted,
        setQuality,
        setVideo,
        setVolume,
        unmute,
      }),
      [
        forceRefresh,
        getCurrentTime,
        getDuration,
        mute,
        pause,
        play,
        playerState.channel,
        playerState.isPaused,
        playerState.muted,
        playerState.volume,
        seek,
        setChannel,
        setMuted,
        setQuality,
        setVideo,
        setVolume,
        unmute,
      ],
    );

    const handleMessage = useCallback(
      (event: WebViewMessageEvent) => {
        try {
          const message = JSON.parse(event.nativeEvent.data) as PlayerMessage;

          switch (message.type) {
            case 'ready': {
              countMetric('stream.ready', {
                autoplay,
                component: 'StreamPlayer',
                defer_overlay_until_user_unmute: deferOverlayUntilUserUnmute,
              });
              setPlayerStatus({
                isReady: true,
                isBuffering: false,
              });
              onReady?.();
              if (!initialMuted && !deferOverlayUntilUserUnmute) {
                const unmuteDeadline = Date.now() + 5000;
                const unmuteInterval = setInterval(() => {
                  unmute();
                  if (Date.now() > unmuteDeadline) {
                    clearInterval(unmuteInterval);
                  }
                }, 100);
              }
              break;
            }
            case 'play':
              setPlayerState(prev => ({ ...prev, isPaused: false }));
              break;
            case 'playing':
              setPlayerState(prev => ({ ...prev, isPaused: false }));
              onPlay?.();
              break;
            case 'pause':
              setPlayerState(prev => ({ ...prev, isPaused: true }));
              onPause?.();
              break;
            case 'ended':
              onEnded?.();
              break;
            case 'online':
              onOnline?.();
              break;
            case 'offline':
              onOffline?.();
              break;
            case 'stateUpdate':
              setPlayerStatus(prev => {
                const { payload } = message;
                if (
                  prev.isReady === payload.isReady &&
                  prev.isBuffering === payload.isBuffering
                ) {
                  return prev;
                }
                return {
                  isReady: payload.isReady,
                  isBuffering: payload.isBuffering,
                };
              });
              setPlayerState(prev => {
                const { payload } = message;
                if (
                  prev.isPaused === payload.isPaused &&
                  prev.muted === payload.muted &&
                  prev.volume === payload.volume
                ) {
                  return prev;
                }
                return {
                  ...prev,
                  isPaused: payload.isPaused,
                  muted: payload.muted,
                  volume: payload.volume,
                };
              });
              break;
            case 'currentTime':
              if (currentTimeResolverRef.current) {
                currentTimeResolverRef.current(message.payload.time);
                currentTimeResolverRef.current = null;
              }
              break;
            case 'duration':
              if (durationResolverRef.current) {
                durationResolverRef.current(message.payload.duration);
                durationResolverRef.current = null;
              }
              break;
            case 'trace':
              if (__DEV__) {
                console.warn(
                  '[StreamPlayer:embed]',
                  message.payload?.step ?? '?',
                  message.payload?.detail ?? '',
                );
              }
              break;
            case 'error':
              console.warn(
                '[StreamPlayer:embed ERROR]',
                message.payload?.message ?? message.payload,
              );
              onError?.(message.payload?.message ?? 'Unknown embed error');
              break;
            case 'contentGateDetected':
              setHasContentGate(message.payload?.hasContentGate ?? false);
              break;
            case 'playbackBlocked':
              break;
            case 'twitchAuthComplete':
              scheduleAuthCompletionReload();
              break;
            case 'playbackStats': {
              const latency = message.payload.hlsLatencyBroadcaster;
              const hasUsableLiveLatency =
                typeof latency === 'number' &&
                Number.isFinite(latency) &&
                latency > 0.25 &&
                latency < 600;

              if (usesHostedPlayer) {
                const nextHasContentGate = !hasUsableLiveLatency;
                setHasContentGate(nextHasContentGate);
                onContentGateChange?.(nextHasContentGate);
              }

              if (hasUsableLiveLatency) {
                setPlaybackLatencySeconds(latency);
                onPlaybackLatencyChange?.(latency);
              } else if (usesHostedPlayer) {
                setPlaybackLatencySeconds(null);
                onPlaybackLatencyChange?.(0);
              }
              break;
            }
            case 'muteState': {
              const { muted: m, volume: v } = message.payload;
              setPlayerState(prev =>
                prev.muted === m && prev.volume === v
                  ? prev
                  : { ...prev, muted: m, volume: v },
              );
              if (deferOverlayUntilUserUnmute && m === false) {
                setOverlayUnlocked(true);
              }
              break;
            }
            default:
              break;
          }
        } catch {
          // ignore parse errors
        }
      },
      [
        autoplay,
        deferOverlayUntilUserUnmute,
        initialMuted,
        onEnded,
        onError,
        onOffline,
        onOnline,
        onContentGateChange,
        onPause,
        onPlaybackLatencyChange,
        onPlay,
        onReady,
        scheduleAuthCompletionReload,
        unmute,
        usesHostedPlayer,
      ],
    );

    const webViewSource = useMemo(() => {
      const channelName = channel || 'twitch';
      const sourceMuted = deferOverlayUntilUserUnmute ? true : initialMuted;
      if (useRawTwitchPlayer) {
        return {
          uri: buildRawTwitchPlayerUrl({
            channel: channelName,
            video,
            parent,
            autoplay: true,
            muted: sourceMuted,
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
      video,
      parent,
      initialMuted,
      deferOverlayUntilUserUnmute,
      useRawTwitchPlayer,
    ]);

    const showControls = useCallback(() => {
      controlsVisibleRef.current = true;
      setControlsVisible(true);
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      controlsTimeoutRef.current = setTimeout(() => {
        controlsVisibleRef.current = false;
        setControlsVisible(false);
      }, 5000);
    }, []);

    const dismissControls = useCallback(() => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      controlsVisibleRef.current = false;
      setControlsVisible(false);
    }, []);

    useEffect(() => {
      return () => {
        if (controlsTimeoutRef.current) {
          clearTimeout(controlsTimeoutRef.current);
        }
      };
    }, []);

    const toggleControlsInternal = useCallback(() => {
      if (controlsVisibleRef.current) {
        dismissControls();
      } else {
        showControls();
      }
    }, [dismissControls, showControls]);

    const singleTapTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
      null,
    );

    const cancelPendingSingleTap = useCallback(() => {
      if (singleTapTimeoutRef.current) {
        clearTimeout(singleTapTimeoutRef.current);
        singleTapTimeoutRef.current = null;
      }
    }, []);

    useEffect(() => {
      return () => cancelPendingSingleTap();
    }, [cancelPendingSingleTap]);

    const handleVideoAreaDoubleTap = useCallback(() => {
      cancelPendingSingleTap();
      if (Platform.OS !== 'web') {
        void impact('light');
      }
      onVideoAreaPress?.();
    }, [onVideoAreaPress, cancelPendingSingleTap]);

    const handleVideoAreaSwipeDown = useCallback(() => {
      cancelPendingSingleTap();
      if (Platform.OS !== 'web') {
        void impact('medium');
      }
      onVideoAreaSwipeDown?.();
    }, [cancelPendingSingleTap, onVideoAreaSwipeDown]);

    const SINGLE_TAP_DELAY_MS = 400;

    const handleSingleTapDelayed = useCallback(() => {
      singleTapTimeoutRef.current = setTimeout(() => {
        singleTapTimeoutRef.current = null;
        toggleControlsInternal();
      }, SINGLE_TAP_DELAY_MS);
    }, [toggleControlsInternal]);

    const overlayTapGesture = useMemo(() => {
      const singleTap = Gesture.Tap()
        .numberOfTaps(1)
        .onEnd(() => {
          scheduleOnRN(handleSingleTapDelayed);
        });
      if (!onVideoAreaPress && !onVideoAreaSwipeDown) {
        return singleTap;
      }
      const gestures = [];
      if (onVideoAreaPress) {
        gestures.push(
          Gesture.Tap()
            .numberOfTaps(2)
            .onEnd(() => {
              scheduleOnRN(handleVideoAreaDoubleTap);
            }),
        );
      }
      if (onVideoAreaSwipeDown) {
        gestures.push(
          Gesture.Fling()
            .direction(Directions.DOWN)
            .onEnd(() => {
              scheduleOnRN(handleVideoAreaSwipeDown);
            }),
        );
      }
      gestures.push(singleTap);
      return Gesture.Exclusive(...gestures);
    }, [
      onVideoAreaPress,
      onVideoAreaSwipeDown,
      handleVideoAreaDoubleTap,
      handleVideoAreaSwipeDown,
      handleSingleTapDelayed,
    ]);

    const handlePlayPause = useCallback(() => {
      if (playerState.isPaused) {
        play();
      } else {
        pause();
      }
      showControls();
    }, [pause, play, playerState.isPaused, showControls]);

    const handlePipPress = useCallback(() => {
      // PiP implementation pending
    }, []);

    const handleWebViewError = useCallback(
      (event: { nativeEvent: WebViewError }) => {
        const { nativeEvent } = event;
        console.warn('[StreamPlayer:WebView ERROR]', {
          code: nativeEvent.code,
          description: nativeEvent.description,
          url: nativeEvent.url,
        });

        recordError({
          name: 'StreamError',
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

        setLastHttpError({
          url: nativeEvent.url,
          statusCode: nativeEvent.statusCode,
        });

        recordError({
          name: 'StreamError',
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
      [channel, onError],
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

    const playerWidth: DimensionValue = width ?? '100%';
    const playerHeight: DimensionValue = height ?? '100%';
    const allowsTwitchInteraction =
      usesHostedPlayer || useRawTwitchPlayer || hasContentGate;
    const shouldShowNativeControls =
      showOverlayControls &&
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
          injectedJavaScript={TWITCH_AUTH_HELPER_SCRIPT}
          injectedJavaScriptBeforeContentLoaded={TWITCH_AUTH_HELPER_SCRIPT}
          injectedJavaScriptBeforeContentLoadedForMainFrameOnly={false}
          injectedJavaScriptForMainFrameOnly={false}
          scrollEnabled={allowsTwitchInteraction}
          keyboardDisplayRequiresUserAction={!allowsTwitchInteraction}
          setBuiltInZoomControls={false}
          setDisplayZoomControls={false}
          setSupportMultipleWindows
          sharedCookiesEnabled
          thirdPartyCookiesEnabled
          originWhitelist={['*']}
          source={webViewSource}
          style={[
            styles.webView,
            allowsTwitchInteraction && styles.webViewScrollable,
          ]}
          onContentProcessDidTerminate={() => {
            remountEmbedWebView();
          }}
          onError={handleWebViewError}
          onHttpError={handleWebViewHttpError}
          onOpenWindow={event => {
            const targetUrl = event.nativeEvent.targetUrl;
            if (!targetUrl || isAppUrl(targetUrl)) {
              return;
            }
            webViewRef.current?.injectJavaScript(
              `window.location.href = ${JSON.stringify(targetUrl)}; true;`,
            );
          }}
          onNavigationStateChange={event => {
            if (isTwitchPassportCallbackUrl(event.url)) {
              scheduleAuthCompletionReload();
            }
          }}
          onShouldStartLoadWithRequest={handleShouldStartLoadWithRequest}
          onLoadEnd={event => {
            onWebViewLoaded?.();
            if (isTwitchPassportCallbackUrl(event.nativeEvent.url)) {
              scheduleAuthCompletionReload();
              return;
            }
            if (useRawTwitchPlayer) {
              return;
            }
            if (needsInitRef.current) {
              needsInitRef.current = false;
            }
          }}
          onLoadStart={() => {
            if (__DEV__) {
              console.warn('[StreamPlayer:WebView] onLoadStart', {
                channel,
                hasVideo: !!video,
              });
            }
          }}
          onMessage={handleMessage}
          onRenderProcessGone={() => {
            remountEmbedWebView();
          }}
        />

        {shouldShowNativeControls && (
          <GestureDetector gesture={overlayTapGesture}>
            <View
              style={styles.touchBlockOverlay}
              accessibilityLabel="Show player controls"
              accessibilityRole="button"
            />
          </GestureDetector>
        )}

        {__DEV__ && lastHttpError && (
          <View
            style={[styles.debugErrorOverlay, { bottom: insets.bottom + 24 }]}
          >
            <Text color="red" weight="semibold">
              HTTP {lastHttpError.statusCode}
            </Text>
            <Text color="gray.contrast" type="xs" numberOfLines={3}>
              {lastHttpError.url}
            </Text>
            <Button
              onPress={() => setLastHttpError(null)}
              style={styles.debugDismissButton}
            >
              <Text color="gray.contrast" type="xs">
                Dismiss
              </Text>
            </Button>
          </View>
        )}

        {shouldShowNativeControls && (
          <PressableArea
            onPress={toggleControlsInternal}
            style={[
              styles.controlsTriggerButton,
              { top: insets.top + theme.space12 },
            ]}
            accessibilityLabel="Show player controls"
            accessibilityRole="button"
          >
            <Icon color={theme.colorWhite} icon="more-horizontal" size={24} />
          </PressableArea>
        )}

        {shouldShowNativeControls && (
          <ControlsOverlay
            isVisible={controlsVisible}
            latencySeconds={playbackLatencySeconds}
            onBackPress={onBackPress}
            onPipPress={handlePipPress}
            onPlayPausePress={handlePlayPause}
            onRefresh={onRefresh}
            onToggleControls={toggleControlsInternal}
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
  bottomControls: {
    alignItems: 'center',
    bottom: 0,
    flexDirection: 'row',
    gap: theme.space12,
    left: 0,
    paddingHorizontal: theme.space16,
    paddingTop: 32,
    position: 'absolute',
    right: 0,
    zIndex: 1,
  },
  bottomGradient: {
    bottom: 0,
    height: 120,
    left: 0,
    position: 'absolute',
    right: 0,
  },
  centerControls: {
    alignItems: 'center',
    bottom: 0,
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  container: {
    backgroundColor: '#000',
    overflow: 'hidden',
    position: 'relative',
  },
  containerScrollable: {
    overflow: 'visible',
  },
  controlButton: {
    alignItems: 'center',
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  controlButtonContainer: {
    alignItems: 'center',
    backgroundColor: theme.colorBlackActiveContent,
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius16,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  controlsOverlay: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  controlsTriggerButton: {
    alignItems: 'center',
    backgroundColor: theme.colorBlackActiveContent,
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius999,
    height: 40,
    justifyContent: 'center',
    padding: theme.space12,
    position: 'absolute',
    right: theme.space12,
    width: 40,
  },
  debugDismissButton: {
    marginTop: theme.space8,
  },
  debugErrorOverlay: {
    backgroundColor: theme.colorBlackActiveContent,
    left: theme.space12,
    maxWidth: '95%',
    padding: theme.space12,
    position: 'absolute',
    right: theme.space12,
  },
  durationText: {
    color: theme.colorWhite,
    fontSize: theme.fontSize11,
    fontWeight: '500',
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    left: 0,
    paddingHorizontal: theme.space12,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 1,
  },
  headerButton: {
    alignItems: 'center',
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  headerButtonContainer: {
    alignItems: 'center',
    backgroundColor: theme.colorBlackActiveContent,
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius16,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  latencyBadge: {
    alignItems: 'center',
    backgroundColor: theme.colorBlackActiveContent,
    borderColor: theme.colorBlackBorderHover,
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: theme.space8,
    paddingHorizontal: theme.space12,
    paddingVertical: theme.space8,
    position: 'absolute',
    right: theme.space12 + 48,
    zIndex: 2,
  },
  latencyBadgeIcon: {
    opacity: 0.9,
  },
  latencyBadgeText: {
    color: theme.colorWhite,
    fontSize: theme.fontSize12,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  liveDot: {
    backgroundColor: theme.colorRed,
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius999,
    height: 8,
    marginRight: theme.space12,
    width: 8,
  },
  liveIndicator: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  overlayTapTarget: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  playPauseButton: {
    alignItems: 'center',
    backgroundColor: theme.colorBlackActiveContent,
    borderRadius: 44,
    height: 88,
    justifyContent: 'center',
    width: 88,
  },
  prewarmHidden: {
    height: 0,
    opacity: 0,
    overflow: 'hidden',
    position: 'absolute',
    width: 0,
    zIndex: -1,
  },
  prewarmWebView: {
    height: 1,
    width: 1,
  },
  spacer: {
    flex: 1,
  },
  streamMetadataRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flex: 1,
    gap: theme.space12,
  },
  streamerNameBottom: {
    color: theme.colorWhite,
    flex: 1,
    fontSize: theme.fontSize12,
    fontWeight: '600',
    opacity: 0.95,
  },
  touchBlockOverlay: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  userIcon: {
    backgroundColor: theme.colorAccentAlpha,
  },
  viewerCountRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.space8,
  },
  viewerCountText: {
    color: theme.colorWhite,
    fontSize: theme.fontSize11,
    fontWeight: '500',
  },
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
