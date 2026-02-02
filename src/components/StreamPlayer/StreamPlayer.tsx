import { Button } from '@app/components/Button';
import { Icon } from '@app/components/Icon';
import { Text } from '@app/components/Text';
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
  useWindowDimensions,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  runOnJS,
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
   * Parent domain for embed
   * @default 'foam-app.com'
   */
  parent?: string;
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
  | { type: 'ended' }
  | { type: 'offline' }
  | { type: 'online' }
  | { type: 'pause' }
  | { type: 'play' }
  | { type: 'ready' };

function generatePlayerURL(options: {
  channel?: string;
  parent: string;
  video?: string;
}): string {
  const { channel, parent, video } = options;

  if (video) {
    return `https://player.twitch.tv/?video=${video}&parent=${parent}&muted=false`;
  }

  return `https://player.twitch.tv/?channel=${channel}&parent=${parent}&muted=false`;
}

/**
 * Simplified injected JS for player controls
 */
const INJECTED_JAVASCRIPT = `
(function() {
  if (window._injected) return;
  window._injected = true;

  function postMessage(type, payload) {
    try {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type, payload }));
    } catch (e) {}
  }

  // Wait for video element
  function waitForVideo(timeout) {
    return new Promise(function(resolve) {
      var video = document.querySelector('video');
      if (video) return resolve(video);

      var timeoutId;
      var observer = new MutationObserver(function() {
        video = document.querySelector('video');
        if (video) {
          observer.disconnect();
          clearTimeout(timeoutId);
          resolve(video);
        }
      });
      observer.observe(document.body, { childList: true, subtree: true });
      timeoutId = setTimeout(function() {
        observer.disconnect();
        resolve(null);
      }, timeout || 15000);
    });
  }

  // Detect content gate
  function detectContentGate() {
    var hasGate = !!(
      document.querySelector('[data-a-target="player-overlay-content-gate"]') ||
      document.querySelector('.content-classification-gate')
    );
    postMessage('contentGateDetected', { hasContentGate: hasGate });
    applyStyles(hasGate);
  }

  // Apply styles to hide Twitch UI and style video
  function applyStyles(hasContentGate) {
    var style = document.getElementById('foam-styles');
    if (!style) {
      style = document.createElement('style');
      style.id = 'foam-styles';
      document.head.appendChild(style);
    }

    var hideControls = '.top-bar, .player-controls, #channel-player-disclosures, ' +
      '[data-a-target="player-overlay-preview-background"], ' +
      '[data-a-target="player-overlay-video-stats"] ' +
      '{ display: none !important; }';

    if (hasContentGate) {
      style.textContent = hideControls +
        'body, html { margin: 0; padding: 0; overflow: auto; -webkit-overflow-scrolling: touch; }' +
        '[data-a-target="player-overlay-content-gate"] { transform: scale(0.85); transform-origin: center; }';
    } else {
      style.textContent = hideControls +
        'body, html { margin: 0; padding: 0; overflow: hidden; }' +
        'video { display: block; width: 100%; height: 100%; object-fit: contain; }';
    }
  }

  // Setup video event listeners
  function setupVideo(video) {
    if (video._setup) return;
    video._setup = true;

    // Disable captions
    if (video.textTracks) {
      for (var i = 0; i < video.textTracks.length; i++) {
        video.textTracks[i].mode = 'hidden';
      }
    }

    video.addEventListener('pause', function() { postMessage('pause'); });
    video.addEventListener('playing', function() {
      postMessage('play');
      video.muted = false;
      video.volume = 1.0;
    });
    video.addEventListener('ended', function() { postMessage('ended'); });
    video.addEventListener('waiting', function() { postMessage('stateUpdate', { isBuffering: true }); });
    video.addEventListener('canplay', function() { postMessage('stateUpdate', { isBuffering: false }); });

    postMessage('ready');

    // Auto-start if not playing
    if (video.paused && video.readyState >= 2) {
      video.play().catch(function() {});
    }
  }

  // Check for offline/error states
  function checkErrors() {
    var bodyText = document.body?.innerText || '';
    if (bodyText.includes('is offline') || bodyText.includes('Channel is not live')) {
      postMessage('offline');
    }
  }

  // Stuck playback recovery
  var lastTime = -1;
  var stuckCount = 0;
  function checkStuck() {
    var video = document.querySelector('video');
    if (!video || video.paused || video.ended) {
      lastTime = -1;
      stuckCount = 0;
      return;
    }

    if (lastTime >= 0 && Math.abs(video.currentTime - lastTime) < 0.1) {
      stuckCount++;
      if (stuckCount >= 3) {
        video.pause();
        setTimeout(function() { video.play().catch(function() {}); }, 100);
        stuckCount = 0;
      }
    } else {
      stuckCount = 0;
    }
    lastTime = video.currentTime;
  }

  // Initialize
  applyStyles(false);
  detectContentGate();

  waitForVideo(15000).then(function(video) {
    if (video) {
      setupVideo(video);
    } else {
      postMessage('error', { message: 'Video element not found' });
    }
  });

  // Periodic checks
  setInterval(detectContentGate, 2000);
  setInterval(checkStuck, 2000);
  setTimeout(checkErrors, 5000);
  setInterval(checkErrors, 30000);

  // Expose controls
  window.playerControls = {
    play: function() {
      var v = document.querySelector('video');
      if (v) { v.play().catch(function() {}); v.muted = false; v.volume = 1.0; }
    },
    pause: function() {
      var v = document.querySelector('video');
      if (v) v.pause();
    },
    mute: function() {
      var v = document.querySelector('video');
      if (v) v.muted = true;
    },
    unmute: function() {
      var v = document.querySelector('video');
      if (v) { v.muted = false; v.volume = 1.0; }
    },
    setVolume: function(vol) {
      var v = document.querySelector('video');
      if (v) { v.volume = vol; if (vol > 0) v.muted = false; }
    },
    seek: function(time) {
      var v = document.querySelector('video');
      if (v) v.currentTime = time;
    }
  };
})();
true;
`;

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

/**
 * Format seconds to duration string (e.g., "6:40:05")
 */
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

/**
 * Format viewer count (e.g., "52,564")
 */
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

        runOnJS(onToggleControls)();
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
      onEnded,
      onError,
      onOffline,
      onOnline,
      onPause,
      onPlay,
      onReady,
      onRefresh,
      parent = 'foam-app.com',
      showOverlayControls = true,
      streamInfo,
      video,
      width,
    },
    ref,
  ) {
    const { width: screenWidth } = useWindowDimensions();
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

    // Track last known video time for stuck detection
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
              webViewRef.current.injectJavaScript(`
                (function() {
                  var video = document.querySelector('video');
                  if (video && !video.paused && video.readyState >= 2) {
                    video.play().catch(function() {});
                  }
                })();
                true;
              `);
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

    // Health monitoring is handled by injected JS - reset refs when state changes
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
      webViewRef.current?.injectJavaScript(`${script}; true;`);
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

    /**
     * Force refresh the player
     */
    const forceRefresh = useCallback(() => {
      setPlayerState(prev => ({
        ...prev,
        isReady: false,
        isBuffering: true,
      }));

      webViewRef.current?.injectJavaScript('window._injected = false;');
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
            case 'error':
              onError?.(message.payload.message);
              break;
            case 'contentGateDetected':
              setHasContentGate(message.payload?.hasContentGate ?? false);
              break;
            default:
              break;
          }
        } catch {
          // Ignore parse errors
        }
      },
      [onEnded, onError, onOffline, onOnline, onPause, onPlay, onReady],
    );

    const playerUrl = useMemo(
      () =>
        generatePlayerURL({
          channel,
          parent,
          video,
        }),
      [channel, parent, video],
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
      if (controlsVisibleRef.current) {
        dismissControls();
      } else {
        showControls();
      }
    }, [dismissControls, showControls]);

    const tapGesture = useMemo(
      () =>
        Gesture.Tap()
          .maxDuration(250)
          .onEnd(() => {
            'worklet';

            scheduleOnRN(toggleControlsInternal);
          })
          .shouldCancelWhenOutside(false),
      [toggleControlsInternal],
    );

    const handlePlayPause = useCallback(() => {
      if (playerState.isPaused) {
        play();
      } else {
        pause();
      }
      showControls();
    }, [pause, play, playerState.isPaused, showControls]);

    const handlePipPress = useCallback(() => {
      console.log('PiP pressed');
    }, []);

    const handleWebViewError = useCallback(
      (event: { nativeEvent: WebViewError }) => {
        const { nativeEvent } = event;

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

    const TWITCH_MIN_WIDTH = 400;
    const TWITCH_MIN_HEIGHT = 300;

    const rawWidth = width ?? screenWidth;
    const rawHeight =
      height ??
      (typeof width === 'number' ? width * (9 / 16) : screenWidth * (9 / 16));

    const playerWidth: DimensionValue =
      typeof rawWidth === 'number'
        ? Math.max(rawWidth, TWITCH_MIN_WIDTH)
        : rawWidth;
    const playerHeight: DimensionValue =
      typeof rawHeight === 'number'
        ? Math.max(rawHeight, TWITCH_MIN_HEIGHT)
        : rawHeight;

    const webViewContent = (
      <WebView
        ref={webViewRef}
        collapsable={false}
        allowsInlineMediaPlayback
        allowsBackForwardNavigationGestures={false}
        mediaPlaybackRequiresUserAction={false}
        allowsFullscreenVideo
        scrollEnabled={hasContentGate}
        injectedJavaScript={INJECTED_JAVASCRIPT}
        javaScriptEnabled
        originWhitelist={['*']}
        sharedCookiesEnabled
        thirdPartyCookiesEnabled
        source={{ uri: playerUrl }}
        style={[
          styles.webView,
          // eslint-disable-next-line react-native/no-inline-styles
          { minWidth: 400, minHeight: 300 },
          hasContentGate && styles.webViewScrollable,
        ]}
        userAgent={
          Platform.OS === 'ios'
            ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
            : 'Mozilla/5.0 (Linux; Android 14; Pixel 8 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36'
        }
        onContentProcessDidTerminate={() => webViewRef.current?.reload()}
        onError={handleWebViewError}
        onHttpError={handleWebViewHttpError}
        onMessage={handleMessage}
        onRenderProcessGone={() => webViewRef.current?.reload()}
      />
    );

    return (
      <View
        collapsable={false}
        style={[
          styles.container,
          { height: playerHeight, width: playerWidth },
          hasContentGate && styles.containerScrollable,
        ]}
      >
        {webViewContent}

        {!hasContentGate && (
          <GestureDetector gesture={tapGesture}>
            <View style={styles.tapArea} />
          </GestureDetector>
        )}

        {showOverlayControls && !hasContentGate && (
          <ControlsOverlay
            isVisible={controlsVisible}
            paused={playerState.isPaused}
            streamInfo={streamInfo}
            onBackPress={onBackPress}
            onPipPress={handlePipPress}
            onPlayPausePress={handlePlayPause}
            onRefresh={onRefresh}
            onToggleControls={toggleControlsInternal}
          />
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
    backgroundColor: theme.colors.gray.bg,
    overflow: 'hidden',
    paddingTop: rt.insets.top,
    position: 'relative',
  },
  containerScrollable: {
    overflow: 'visible',
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
    backgroundColor: theme.colors.gray.bg,
    flex: 1,
  },
}));
