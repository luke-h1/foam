/**
 * Native HLS Stream Player using react-native-video
 *
 * A simpler, more performant video player that uses native HLS streaming
 * instead of an embedded WebView player.
 *
 * ⚠️ NOT FOR PRODUCTION USE ⚠️
 *
 * This implementation uses Twitch's unofficial GQL API to obtain stream
 * access tokens. This approach:
 * - Uses undocumented/unofficial Twitch APIs that could break at any time
 * - May violate Twitch's Terms of Service
 * - Is intended for development/debugging purposes only
 * - Should never be shipped to production builds
 *
 * For production, use the WebView-based StreamPlayer which uses
 * Twitch's official embedded player.
 */

import { Button } from '@app/components/Button/Button';
import { Icon } from '@app/components/Icon/Icon';
import { Slider } from '@app/components/Slider/Slider';
import { Text } from '@app/components/Text/Text';
import { twitchHlsService } from '@app/services/twitch-hls-service';
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { type DimensionValue, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { StyleSheet } from 'react-native-unistyles';
import Video, { type OnLoadData, type VideoRef } from 'react-native-video';

export interface NativeStreamPlayerRef {
  forceRefresh: () => void;
  getChannel: () => string | undefined;
  getMuted: () => boolean;
  getPaused: () => boolean;
  mute: () => void;
  pause: () => void;
  play: () => void;
  setChannel: (channel: string) => void;
  setMuted: (muted: boolean) => void;
  unmute: () => void;
}

export interface StreamInfo {
  gameName?: string;
  profileImageUrl?: string;
  startedAt?: string;
  title?: string;
  userName?: string;
  userLogin?: string;
  viewerCount?: number;
}

export interface NativeStreamPlayerProps {
  autoplay?: boolean;
  channel?: string;
  height?: DimensionValue;
  muted?: boolean;
  onBackPress?: () => void;
  onEnded?: () => void;
  onError?: (error: string) => void;
  onPause?: () => void;
  onPlay?: () => void;
  onReady?: () => void;
  onRefresh?: () => void;
  /**
   * Optional callback when the user taps the video area (e.g. to toggle chat in landscape).
   */
  onVideoAreaPress?: () => void;
  showOverlayControls?: boolean;
  streamInfo?: StreamInfo;
  width?: DimensionValue;
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

interface ControlsOverlayProps {
  isVisible: boolean;
  muted: boolean;
  onBackPress?: () => void;
  onMutePress: () => void;
  onPlayPausePress: () => void;
  onRefresh?: () => void;
  onToggleControls: () => void;
  onVolumeChange: (value: number) => void;
  paused: boolean;
  streamInfo?: StreamInfo;
  volume: number;
}

function ControlsOverlay({
  isVisible,
  muted,
  onBackPress,
  onMutePress,
  onPlayPausePress,
  onRefresh,
  onToggleControls,
  onVolumeChange,
  paused,
  streamInfo,
  volume,
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

      <View style={styles.volumeRow} pointerEvents="box-none">
        <View style={styles.volumeControls} pointerEvents="auto">
          <Button
            label={muted ? 'Unmute' : 'Mute'}
            style={styles.volumeButton}
            onPress={onMutePress}
          >
            <Icon
              color="#FFFFFF"
              icon={muted ? 'volume-variant-off' : 'volume-high'}
              iconFamily="MaterialCommunityIcons"
              size={22}
            />
          </Button>
          <Slider
            max={1}
            min={0}
            onChange={onVolumeChange}
            step={0.05}
            style={styles.volumeSlider}
            value={muted ? 0 : volume}
          />
        </View>
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
      </View>
    </Animated.View>
  );
}

export const NativeStreamPlayer = forwardRef<
  NativeStreamPlayerRef,
  NativeStreamPlayerProps
>(function NativeStreamPlayer(
  {
    autoplay = true,
    channel,
    height,
    muted: initialMuted = __DEV__,
    onBackPress,
    onEnded,
    onError,
    onPause,
    onPlay,
    onReady,
    onRefresh,
    onVideoAreaPress,
    showOverlayControls = true,
    streamInfo,
    width,
  },
  ref,
) {
  const videoRef = useRef<VideoRef>(null);
  const [hlsUrl, setHlsUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(!autoplay);
  const [isMuted, setIsMuted] = useState(initialMuted);
  const [volume, setVolume] = useState(1);
  const [currentChannel, setCurrentChannel] = useState(channel);

  const [controlsVisible, setControlsVisible] = useState(false);
  const controlsVisibleRef = useRef(false);
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch HLS URL when channel changes
  useEffect(() => {
    if (!currentChannel) {
      setHlsUrl(null);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    twitchHlsService
      .getHlsStreamUrl(currentChannel)
      .then(url => {
        if (!cancelled) {
          setHlsUrl(url);
          setIsLoading(false);
        }
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setError(err.message || 'Failed to load stream');
          onError?.(err.message || 'Failed to load stream');
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [currentChannel, onError]);

  const mute = useCallback(() => {
    setIsMuted(true);
  }, []);

  const unmute = useCallback(() => {
    setIsMuted(false);
  }, []);

  const setMutedState = useCallback((muted: boolean) => {
    setIsMuted(muted);
  }, []);

  const play = useCallback(() => {
    setIsPaused(false);
  }, []);

  const pause = useCallback(() => {
    setIsPaused(true);
  }, []);

  const forceRefresh = useCallback(() => {
    if (!currentChannel) return;

    setIsLoading(true);
    setHlsUrl(null);
    setError(null);

    twitchHlsService
      .getHlsStreamUrl(currentChannel)
      .then(url => {
        setHlsUrl(url);
        setIsLoading(false);
      })
      .catch((err: Error) => {
        setError(err.message || 'Failed to refresh stream');
        onError?.(err.message || 'Failed to refresh stream');
        setIsLoading(false);
      });
  }, [currentChannel, onError]);

  useImperativeHandle(
    ref,
    () => ({
      forceRefresh,
      getChannel: () => currentChannel,
      getMuted: () => isMuted,
      getPaused: () => isPaused,
      mute,
      pause,
      play,
      setChannel: setCurrentChannel,
      setMuted: setMutedState,
      unmute,
    }),
    [
      currentChannel,
      forceRefresh,
      isMuted,
      isPaused,
      mute,
      pause,
      play,
      setMutedState,
      unmute,
    ],
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

  const toggleControls = useCallback(() => {
    if (controlsVisibleRef.current) {
      dismissControls();
    } else {
      showControls();
    }
  }, [dismissControls, showControls]);

  const handleVideoTap = useCallback(() => {
    onVideoAreaPress?.();
    toggleControls();
  }, [onVideoAreaPress, toggleControls]);

  const handlePlayPause = useCallback(() => {
    setIsPaused(prev => !prev);
    showControls();
  }, [showControls]);

  const tapGesture = useMemo(
    () =>
      Gesture.Tap()
        .maxDuration(250)
        .onEnd(() => {
          'worklet';

          runOnJS(handleVideoTap)();
        })
        .shouldCancelWhenOutside(false),
    [handleVideoTap],
  );

  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, []);

  const containerStyle = useMemo(
    () => [
      styles.container,
      {
        width: width ?? '100%',
        height: height ?? '100%',
      },
    ],
    [width, height],
  );

  const handleLoad = useCallback(
    (_: OnLoadData) => {
      onReady?.();
    },
    [onReady],
  );

  const handleError = useCallback(
    (err: { error: { errorString?: string } }) => {
      const errorMessage = err?.error?.errorString || 'Playback error';
      setError(errorMessage);
      onError?.(errorMessage);
    },
    [onError],
  );

  const handleEnd = useCallback(() => {
    onEnded?.();
  }, [onEnded]);

  const handlePlaybackStateChanged = useCallback(
    (state: { isPlaying: boolean }) => {
      if (state.isPlaying) {
        onPlay?.();
      } else {
        onPause?.();
      }
    },
    [onPlay, onPause],
  );

  if (error) {
    return (
      <View style={containerStyle}>
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <Button
            label="Retry"
            style={styles.retryButton}
            onPress={forceRefresh}
          >
            <Text style={styles.retryText}>Retry</Text>
          </Button>
        </View>
      </View>
    );
  }

  if (isLoading || !hlsUrl) {
    return (
      <View style={containerStyle}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading stream...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={containerStyle}>
      <Video
        ref={videoRef}
        source={{
          uri: hlsUrl,
          type: 'm3u8',
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          },
        }}
        style={styles.video}
        resizeMode="contain"
        paused={isPaused}
        muted={isMuted}
        volume={isMuted ? 0 : volume}
        rate={1.0}
        repeat={false}
        playInBackground={false}
        playWhenInactive={false}
        ignoreSilentSwitch="ignore"
        automaticallyWaitsToMinimizeStalling={false}
        bufferConfig={{
          minBufferMs: 15000,
          maxBufferMs: 50000,
          bufferForPlaybackMs: 2500,
          bufferForPlaybackAfterRebufferMs: 5000,
          live: {
            targetOffsetMs: 2000,
          },
        }}
        onLoad={handleLoad}
        onError={handleError}
        onEnd={handleEnd}
        onPlaybackStateChanged={handlePlaybackStateChanged}
        onBuffer={({ isBuffering }) => {
          if (isBuffering) {
            console.log('[NativeStreamPlayer] Buffering...');
          }
        }}
      />

      <GestureDetector gesture={tapGesture}>
        <View style={styles.tapArea} />
      </GestureDetector>

      {showOverlayControls && (
        <ControlsOverlay
          isVisible={controlsVisible}
          muted={isMuted}
          onBackPress={onBackPress}
          onMutePress={() => setIsMuted(prev => !prev)}
          onPlayPausePress={handlePlayPause}
          onRefresh={onRefresh ?? forceRefresh}
          onToggleControls={toggleControls}
          onVolumeChange={v => {
            setVolume(v);
            if (v > 0) setIsMuted(false);
          }}
          paused={isPaused}
          streamInfo={streamInfo}
          volume={volume}
        />
      )}
    </View>
  );
});

const styles = StyleSheet.create((theme, rt) => ({
  container: {
    backgroundColor: theme.colors.gray.bg,
    overflow: 'hidden',
    position: 'relative',
  },
  video: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: theme.colors.gray.contrast,
    fontSize: theme.font.fontSize.sm,
  },
  errorText: {
    color: theme.colors.red.accent,
    fontSize: theme.font.fontSize.sm,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  retryButton: {
    backgroundColor: theme.colors.gray.uiAlpha,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radii.sm,
  },
  retryText: {
    color: theme.colors.gray.contrast,
    fontSize: theme.font.fontSize.sm,
  },
  tapArea: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  controlsOverlay: {
    bottom: 0,
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
  gradientTop: {
    backgroundColor: theme.colors.black.borderHoverAlpha,
    height: 80,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  gradientBottom: {
    backgroundColor: theme.colors.black.borderHoverAlpha,
    bottom: 0,
    height: 80,
    left: 0,
    position: 'absolute',
    right: 0,
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
  spacer: {
    flex: 1,
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
  playPauseButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.black.uiActiveAlpha,
    borderRadius: 40,
    height: 80,
    justifyContent: 'center',
    width: 80,
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
  volumeButton: {
    alignItems: 'center',
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  volumeControls: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.sm,
  },
  volumeRow: {
    bottom: rt.insets.bottom + 48,
    left: 0,
    position: 'absolute',
    right: 0,
  },
  volumeSlider: {
    flex: 1,
    minWidth: 80,
  },
  liveIndicatorContainer: {
    alignItems: 'center',
    backgroundColor: theme.colors.black.uiActiveAlpha,
    borderRadius: theme.radii.sm,
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: 2,
  },
  liveIndicator: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  liveDot: {
    backgroundColor: theme.colors.red.accent,
    borderRadius: theme.radii.full,
    height: 8,
    marginRight: theme.spacing.sm,
    width: 8,
  },
  durationText: {
    color: theme.colors.gray.contrast,
    fontSize: theme.font.fontSize.xxs,
    fontWeight: '500',
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
  userIcon: {
    backgroundColor: theme.colors.accent.accentAlpha,
  },
  controlButtonContainer: {
    alignItems: 'center',
    borderRadius: theme.radii.sm,
    height: 20,
    justifyContent: 'center',
    width: 36,
  },
  controlButton: {
    alignItems: 'center',
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
}));
