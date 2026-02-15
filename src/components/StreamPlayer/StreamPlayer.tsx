import { Button } from '@app/components/Button/Button';
import { Icon } from '@app/components/Icon/Icon';
import { PressableArea } from '@app/components/PressableArea/PressableArea';
import { Text } from '@app/components/Text/Text';
import { sentryService } from '@app/services/sentry-service';
import {
  forwardRef,
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
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { StyleSheet } from 'react-native-unistyles';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import type {
  WebViewError,
  WebViewHttpError,
} from 'react-native-webview/lib/WebViewTypes';
import { scheduleOnRN } from 'react-native-worklets';

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
  isBuffering: boolean;
  isPaused: boolean;
  isReady: boolean;
  muted: boolean;
  quality: string;
  volume: number;
}

type PlayerMessage =
  | { payload: { message: string }; type: 'error' }
  | { payload: { time: number }; type: 'currentTime' }
  | { payload: { duration: number }; type: 'duration' }
  | { payload: PlayerState; type: 'stateUpdate' }
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
  | { type: 'ready' }
  | { type: 'trace'; payload: { step: string; detail?: string } }
  | { type: 'error'; payload: { message: string } };

function buildTwitchEmbedHtml(options: {
  channel: string;
  video?: string;
  parent: string;
  autoplay: boolean;
  muted: boolean;
  width: number | string;
  height: number | string;
}): string {
  const { channel, video, parent, autoplay, muted, width, height } = options;
  const safeChannel = channel.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  const safeParent = parent.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  const widthPx = typeof width === 'number' ? `${width}px` : width;
  const heightPx = typeof height === 'number' ? `${height}px` : height;

  return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; overflow: hidden; background: #000; }
    #twitch-player { width: 100%; height: 100%; }
  </style>
</head>
<body>
  <div id="twitch-player" style="width:${widthPx};height:${heightPx};"></div>
  <script>
    function post(type, payload) {
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
        player.addEventListener(Twitch.Player.READY, function() { post('ready'); });
        player.addEventListener(Twitch.Player.PLAY, function() { post('play'); });
        player.addEventListener(Twitch.Player.PAUSE, function() { post('pause'); });
        player.addEventListener(Twitch.Player.PLAYING, function() {
          post('stateUpdate', { isBuffering: false, isPaused: false, isReady: true });
        });
        player.addEventListener(Twitch.Player.ENDED, function() { post('ended'); });
        player.addEventListener(Twitch.Player.OFFLINE, function() { post('offline'); });
        player.addEventListener(Twitch.Player.ONLINE, function() { post('online'); });
        window.playerControls = {
          play: function() { player.play(); },
          pause: function() { player.pause(); },
          setMuted: function(m) { player.setMuted(m); },
          unmute: function() { player.setMuted(false); player.setVolume(1); },
          setVolume: function(v) { player.setVolume(v); if (v > 0) player.setMuted(false); },
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

interface ControlsOverlayProps {
  isVisible: boolean;
  onBackPress?: () => void;
  onPipPress?: () => void;
  onPlayPausePress: () => void;
  onRefresh?: () => void;
  onToggleControls: () => void;
  paused: boolean;
  showPip?: boolean;
  streamInfo?: StreamInfo;
}

function formatDuration(startedAt?: string): string {
  if (!startedAt) return '0:00';
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
  if (!count) return '0';
  return count.toLocaleString();
}

function ControlsOverlay({
  isVisible,
  onBackPress,
  onPipPress,
  onPlayPausePress,
  onRefresh,
  onToggleControls,
  paused,
  showPip = Platform.OS === 'ios',
  streamInfo,
}: ControlsOverlayProps) {
  const opacity = useSharedValue(0);
  const [duration, setDuration] = useState(() =>
    formatDuration(streamInfo?.startedAt),
  );

  useEffect(() => {
    if (!streamInfo?.startedAt) return;

    const interval = setInterval(() => {
      setDuration(formatDuration(streamInfo.startedAt));
    }, 1000);

    return () => clearInterval(interval);
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
        <View style={styles.overlayBackground} />
      </GestureDetector>

      <View pointerEvents="none" style={styles.gradientTop} />
      <View pointerEvents="none" style={styles.gradientBottom} />

      <View style={styles.header}>
        {onBackPress && (
          <View style={styles.headerButtonContainer}>
            <Button
              label="Back"
              style={styles.headerButton}
              onPress={onBackPress}
            >
              <Icon color="#FFFFFF" icon="chevron-left" size={24} />
            </Button>
          </View>
        )}

        <View style={styles.streamerNameContainer}>
          <Text numberOfLines={1} style={styles.streamerName}>
            {streamInfo?.userName || streamInfo?.userLogin || ''}
          </Text>
        </View>

        <View style={styles.spacer} />
      </View>

      <View style={styles.centerControls}>
        <Button
          label={paused ? 'Play' : 'Pause'}
          style={styles.playPauseButton}
          onPress={onPlayPausePress}
        >
          <Icon color="#FFFFFF" icon={paused ? 'play' : 'pause'} size={40} />
        </Button>
      </View>

      <View style={styles.bottomControls}>
        <View style={styles.liveIndicatorContainer}>
          <View style={styles.liveIndicator}>
            <View style={styles.liveDot} />
            <Text style={styles.durationText}>{duration}</Text>
          </View>
        </View>

        <View style={styles.viewerCountContainer}>
          <Icon icon="user" size={20} style={styles.userIcon} />
          <Text style={styles.viewerCountText}>
            {formatViewerCount(streamInfo?.viewerCount)}
          </Text>
        </View>

        <View style={styles.spacer} />
        {onRefresh && (
          <View style={styles.controlButtonContainer}>
            <Button
              label="Refresh"
              style={styles.controlButton}
              onPress={onRefresh}
            >
              <Icon color="#FFFFFF" icon="refresh-cw" size={18} />
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
                color="#FFFFFF"
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

export const StreamPlayer = forwardRef<StreamPlayerRef, StreamPlayerProps>(
  function StreamPlayer(
    {
      autoplay = true,
      channel,
      height,
      muted: initialMuted = false,
      onBackPress,
      onContentGateChange,
      onEnded,
      onError,
      onOffline,
      onOnline,
      onPause,
      onPlay,
      onReady,
      onRefresh,
      onVideoAreaPress,
      parent = 'www.twitch.tv',
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      streamProxyBaseUrl: _streamProxyBaseUrl,
      showOverlayControls = true,
      streamInfo,
      video,
      width,
    },
    ref,
  ) {
    const webViewRef = useRef<WebView>(null);

    const [playerState, setPlayerState] = useState<PlayerState>({
      channel,
      currentTime: 0,
      duration: 0,
      isBuffering: true,
      isPaused: !autoplay,
      isReady: false,
      muted: initialMuted,
      quality: 'auto',
      volume: 1,
    });

    const [controlsVisible, setControlsVisible] = useState(false);
    const controlsVisibleRef = useRef(false);
    const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
      null,
    );
    const [hasContentGate, setHasContentGate] = useState(false);
    const [showLoginPrompt, setShowLoginPrompt] = useState(true);

    useEffect(() => {
      if (hasContentGate) setShowLoginPrompt(true);
    }, [hasContentGate]);

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

    useEffect(() => {
      const handleAppStateChange = (nextAppState: AppStateStatus) => {
        if (
          appStateRef.current.match(/inactive|background/) &&
          nextAppState === 'active'
        ) {
          // Resume playback when app returns to foreground
          setTimeout(() => {
            if (webViewRef.current && playerState.isReady) {
              webViewRef.current.injectJavaScript(
                'try { if (window.playerControls) window.playerControls.play(); } catch(e) {}; true;',
              );
            }
          }, 500);
        }

        appStateRef.current = nextAppState;
      };

      const subscription = AppState.addEventListener(
        'change',
        handleAppStateChange,
      );

      return () => {
        subscription.remove();
      };
    }, [playerState.isReady]);

    // Reset stuck-detection refs when not ready or paused
    useEffect(() => {
      if (!playerState.isReady || playerState.isPaused) {
        lastVideoTimeRef.current = -1;
        stuckCountRef.current = 0;
      }
    }, [playerState.isReady, playerState.isPaused]);

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

    const forceRefresh = useCallback(() => {
      setPlayerState(prev => ({
        ...prev,
        isReady: false,
        isBuffering: true,
      }));

      setTimeout(() => {
        webViewRef.current?.reload();
      }, 100);
    }, []);

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
            case 'ready':
              setPlayerState(prev => ({
                ...prev,
                isReady: true,
                isBuffering: false,
              }));
              onReady?.();
              break;
            case 'play':
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
              setPlayerState(prev => {
                const { payload } = message;
                if (
                  prev.isPaused === payload.isPaused &&
                  prev.muted === payload.muted &&
                  prev.volume === payload.volume &&
                  prev.isReady === payload.isReady &&
                  prev.isBuffering === payload.isBuffering
                ) {
                  return prev;
                }
                return { ...prev, ...payload };
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
              console.warn(
                '[StreamPlayer:embed]',
                message.payload?.step ?? '?',
                message.payload?.detail ?? '',
              );
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
            default:
              break;
          }
        } catch {
          // ignore parse errors
        }
      },
      [onEnded, onError, onOffline, onOnline, onPause, onPlay, onReady],
    );

    const webViewSource = useMemo(
      () => ({
        html: buildTwitchEmbedHtml({
          channel: channel || 'twitch',
          video,
          parent,
          autoplay: true,
          muted: initialMuted,
          width: '100%',
          height: '100%',
        }),
        baseUrl: `https://${parent}/`,
      }),
      [channel, video, parent, initialMuted],
    );

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
      onVideoAreaPress?.();
      if (controlsVisibleRef.current) {
        dismissControls();
      } else {
        showControls();
      }
    }, [dismissControls, showControls, onVideoAreaPress]);

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

        sentryService.captureException(
          new Error(`StreamPlayer WebView error: ${nativeEvent.description}`),
          {
            tags: { component: 'StreamPlayer', errorType: 'webview_error' },
            extra: {
              code: nativeEvent.code,
              description: nativeEvent.description,
              url: nativeEvent.url,
              channel,
            },
          },
        );

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

        sentryService.captureException(
          new Error(
            `StreamPlayer HTTP error: ${nativeEvent.statusCode} ${nativeEvent.description}`,
          ),
          {
            tags: { component: 'StreamPlayer', errorType: 'http_error' },
            extra: {
              statusCode: nativeEvent.statusCode,
              description: nativeEvent.description,
              url: nativeEvent.url,
              channel,
            },
          },
        );

        onError?.(`HTTP ${nativeEvent.statusCode}: ${nativeEvent.description}`);
      },
      [channel, onError],
    );

    const playerWidth: DimensionValue = width ?? '100%';
    const playerHeight: DimensionValue = height ?? '100%';

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
          ref={webViewRef}
          allowsFullscreenVideo={false}
          allowsInlineMediaPlayback
          javaScriptEnabled
          mediaPlaybackRequiresUserAction={false}
          originWhitelist={['*']}
          source={webViewSource}
          style={[styles.webView, hasContentGate && styles.webViewScrollable]}
          onContentProcessDidTerminate={() => webViewRef.current?.reload()}
          onError={handleWebViewError}
          onHttpError={handleWebViewHttpError}
          onLoadStart={() => {
            console.warn('[StreamPlayer:WebView] onLoadStart', {
              channel,
              hasVideo: !!video,
            });
          }}
          onMessage={handleMessage}
          onRenderProcessGone={() => webViewRef.current?.reload()}
        />

        {showOverlayControls && !hasContentGate && playerState.isReady && (
          <PressableArea
            onPress={toggleControlsInternal}
            style={styles.touchBlockOverlay}
            pointerEvents="auto"
            accessibilityLabel="Show player controls"
            accessibilityRole="button"
          />
        )}

        {__DEV__ && lastHttpError && (
          <View style={styles.debugErrorOverlay}>
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

        {showOverlayControls && !hasContentGate && playerState.isReady && (
          <PressableArea
            onPress={toggleControlsInternal}
            style={styles.controlsTriggerButton}
            accessibilityLabel="Show player controls"
            accessibilityRole="button"
          >
            <Icon color="#FFFFFF" icon="more-horizontal" size={24} />
          </PressableArea>
        )}

        {showOverlayControls && !hasContentGate && playerState.isReady && (
          <ControlsOverlay
            isVisible={controlsVisible}
            onBackPress={onBackPress}
            onPipPress={handlePipPress}
            onPlayPausePress={handlePlayPause}
            onRefresh={onRefresh}
            onToggleControls={toggleControlsInternal}
            paused={playerState.isPaused}
            streamInfo={streamInfo}
          />
        )}

        {hasContentGate && (
          // eslint-disable-next-line react/jsx-no-useless-fragment
          <>
            {showLoginPrompt && (
              <View style={styles.loginPromptOverlay} pointerEvents="box-none">
                <View style={styles.loginPromptBanner}>
                  <Text
                    color="gray.contrast"
                    type="sm"
                    style={styles.loginPromptText}
                  >
                    Some streams require a Twitch account. Tap the video to log
                    in if Twitch prompts you.
                  </Text>
                  <PressableArea
                    onPress={() => setShowLoginPrompt(false)}
                    style={styles.loginPromptDismiss}
                  >
                    <Text color="accent" weight="semibold" type="sm">
                      Got it
                    </Text>
                  </PressableArea>
                </View>
              </View>
            )}
          </>
        )}
      </View>
    );
  },
);

const styles = StyleSheet.create((theme, rt) => ({
  avatar: {
    borderRadius: theme.radii.full,
    height: theme.spacing['4xl'],
    marginRight: theme.spacing.sm,
    width: theme.spacing['4xl'],
  },
  userIcon: {
    backgroundColor: theme.colors.accent.accentAlpha,
  },
  bottomControls: {
    alignItems: 'center',
    bottom: 0,
    flexDirection: 'row',
    gap: theme.spacing.sm,
    left: 0,
    paddingBottom: rt.insets.bottom + 4,
    paddingHorizontal: theme.spacing.sm,
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
  touchBlockOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  containerScrollable: {
    overflow: 'visible',
  },
  loginPromptOverlay: {
    left: 0,
    paddingHorizontal: theme.spacing.md,
    paddingTop: rt.insets.top + theme.spacing.sm,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  controlsTriggerButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.black.uiActiveAlpha,
    borderRadius: theme.radii.full,
    height: 40,
    justifyContent: 'center',
    padding: theme.spacing.sm,
    position: 'absolute',
    right: theme.spacing.sm,
    top: rt.insets.top + theme.spacing.sm,
    width: 40,
  },
  debugErrorOverlay: {
    backgroundColor: theme.colors.black.uiActiveAlpha,
    bottom: rt.insets.bottom + 24,
    left: theme.spacing.sm,
    maxWidth: '95%',
    padding: theme.spacing.sm,
    position: 'absolute',
    right: theme.spacing.sm,
  },
  debugDismissButton: {
    marginTop: theme.spacing.xs,
  },
  loginPromptBanner: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: theme.colors.black.uiActiveAlpha,
    borderRadius: theme.radii.md,
    maxWidth: 340,
    padding: theme.spacing.md,
  },
  loginPromptDismiss: {
    marginTop: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  loginPromptText: {
    textAlign: 'center',
  },
  webViewScrollable: {
    minHeight: '100%',
  },
  controlButton: {
    alignItems: 'center',
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  controlButtonContainer: {
    alignItems: 'center',
    borderRadius: theme.radii.sm,
    height: 20,
    justifyContent: 'center',
    width: 36,
  },
  controlsOverlay: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  durationText: {
    color: theme.colors.gray.contrast,
    fontSize: theme.font.fontSize.xxs,
    fontWeight: '500',
  },
  gameName: {
    color: theme.colors.gray.contrast,
    fontSize: theme.font.fontSize.xxs,
    marginLeft: theme.spacing.sm,
    opacity: 0.9,
  },
  gameRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: theme.spacing.xs,
  },
  gradientBottom: {
    backgroundColor: theme.colors.black.borderHoverAlpha,
    bottom: 0,
    height: 80,
    left: 0,
    position: 'absolute',
    right: 0,
  },
  gradientTop: {
    backgroundColor: theme.colors.black.borderHoverAlpha,
    height: 80,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    left: 0,
    paddingHorizontal: theme.spacing.xs,
    paddingTop: rt.insets.top + 2,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 1,
  },
  headerButton: {
    alignItems: 'center',
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  headerButtonContainer: {
    alignItems: 'center',
    backgroundColor: theme.colors.black.uiActiveAlpha,
    borderRadius: theme.radii.sm,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  headerInfo: {
    flex: 1,
    marginRight: theme.spacing.md,
  },
  liveDot: {
    backgroundColor: theme.colors.red.accent,
    borderRadius: theme.radii.full,
    height: 8,
    marginRight: theme.spacing.sm,
    width: 8,
  },
  liveIndicator: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  liveIndicatorContainer: {
    alignItems: 'center',
    backgroundColor: theme.colors.black.uiActiveAlpha,
    borderRadius: theme.radii.sm,
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: 2,
  },
  loadingOverlay: {
    alignItems: 'center',
    backgroundColor: theme.colors.gray.bg,
    bottom: 0,
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  overlayBackground: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  playPauseButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.black.uiActiveAlpha,
    borderRadius: 40,
    height: 80,
    justifyContent: 'center',
    width: 80,
  },
  spacer: {
    flex: 1,
  },
  tapArea: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  streamerLogin: {
    color: theme.colors.gray.contrast,
    fontSize: theme.font.fontSize.xs,
    fontWeight: '400',
    opacity: 0.7,
  },
  streamerName: {
    color: theme.colors.gray.contrast,
    fontSize: theme.font.fontSize.xs,
    fontWeight: '600',
  },
  streamerNameContainer: {
    backgroundColor: theme.colors.black.uiActiveAlpha,
    borderRadius: theme.radii.sm,
    flex: 1,
    marginHorizontal: theme.spacing.xs,
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: 2,
  },
  viewerCount: {
    alignItems: 'center',
    flexDirection: 'row',
    marginLeft: theme.spacing.md,
  },
  viewerCountContainer: {
    alignItems: 'center',
    backgroundColor: theme.colors.black.uiActiveAlpha,
    borderRadius: theme.radii.sm,
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: 2,
  },
  viewerCountText: {
    color: theme.colors.gray.contrast,
    fontSize: theme.font.fontSize.xxs,
    fontWeight: '500',
  },
  webView: {
    backgroundColor: '#000',
    flex: 1,
    width: '100%',
    height: '100%',
  },
  webViewPlaceholder: {
    backgroundColor: '#111',
  },
}));
