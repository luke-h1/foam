import { Button } from '@app/components/Button/Button';
import { Text } from '@app/components/ui/Text/Text';
import { theme } from '@app/styles/themes';
import { LinearGradient } from 'expo-linear-gradient';
import { SymbolView } from 'expo-symbols';
import { useEffect, useMemo, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

import type { StreamInfo } from './types';

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

export function ControlsOverlay({
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
        <SymbolView
          name="clock"
          size={12}
          tintColor={theme.colorWhite}
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
              <SymbolView
                name="chevron.left"
                size={24}
                tintColor={theme.colorWhite}
              />
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
          <SymbolView
            name={paused ? 'play.fill' : 'pause.fill'}
            size={40}
            tintColor={theme.colorWhite}
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
            <SymbolView
              name="person"
              size={14}
              style={styles.userIcon}
              tintColor={theme.colorWhite}
            />
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
              <SymbolView
                name="arrow.clockwise"
                size={18}
                tintColor={theme.colorWhite}
              />
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
              <SymbolView name="pip" size={20} tintColor={theme.colorWhite} />
            </Button>
          </View>
        )}
      </View>
    </Animated.View>
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
});
