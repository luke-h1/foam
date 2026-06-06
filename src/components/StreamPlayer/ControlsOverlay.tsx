import { Button } from '@app/components/Button/Button';
import { Text } from '@app/components/ui/Text/Text';
import { theme } from '@app/styles/themes';
import { LinearGradient } from 'expo-linear-gradient';
import { SymbolView } from 'expo-symbols';
import { useEffect, useState } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { StreamInfo } from './types';

interface ControlsOverlayProps {
  isVisible: boolean;
  latencySeconds?: number | null;
  onBackPress?: () => void;
  onPipPress?: () => void;
  onPlayPausePress: () => void;
  onRefresh?: () => void;
  onSharePress?: () => void;
  onToggleControls: () => void;
  paused: boolean;
  showPip?: boolean;
  streamInfo?: StreamInfo;
}

interface OverlayMetricsState {
  duration: string;
}

import { formatDuration } from './formatStreamDuration';

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
  onSharePress,
  onToggleControls,
  paused,
  showPip,
  streamInfo,
}: ControlsOverlayProps) {
  const showPipButton = showPip ?? Platform.OS === 'ios';
  const insets = useSafeAreaInsets();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const isPortrait = windowHeight >= windowWidth;
  const headerTopOffset = isPortrait ? theme.space12 : insets.top + 8;
  const bottomOffset = isPortrait ? theme.space8 : insets.bottom + 12;
  const opacity = useSharedValue(0);
  const [metrics, setMetrics] = useState<OverlayMetricsState>({
    duration: '0:00',
  });

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

  const durationLabel = streamInfo?.startedAt ? metrics.duration : '0:00';

  useEffect(() => {
    opacity.set(
      withTiming(isVisible ? 1 : 0, {
        duration: 200,
        easing: Easing.ease,
      }),
    );
  }, [isVisible, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.get(),
    pointerEvents: opacity.get() > 0.5 ? 'auto' : 'none',
  }));

  return (
    <Animated.View style={[styles.controlsOverlay, animatedStyle]}>
      <Pressable
        accessibilityRole='button'
        onPress={onToggleControls}
        style={styles.overlayTapTarget}
      />

      <LinearGradient
        colors={['rgba(0,0,0,0.86)', 'rgba(0,0,0,0.42)', 'transparent']}
        style={styles.topGradient}
        pointerEvents='none'
      />

      <View
        style={[
          styles.header,
          isPortrait && styles.headerPortrait,
          { paddingTop: headerTopOffset },
        ]}
      >
        {onBackPress && (
          <View style={styles.headerButtonContainer}>
            <Button
              label='Back'
              style={styles.headerButton}
              onPress={onBackPress}
            >
              <SymbolView
                name='chevron.left'
                size={24}
                tintColor={theme.colorWhite}
              />
            </Button>
          </View>
        )}

        <View
          pointerEvents='none'
          style={[
            styles.headerMetadata,
            isPortrait && styles.headerMetadataPortrait,
          ]}
        >
          <Text numberOfLines={1} style={styles.streamerNameTop}>
            {streamInfo?.userName || streamInfo?.userLogin || ''}
          </Text>
          {streamInfo?.title && !isPortrait && (
            <Text numberOfLines={1} style={styles.streamTitleTop}>
              {streamInfo.title}
            </Text>
          )}
        </View>

        <View style={styles.spacer} />

        <View
          pointerEvents='none'
          style={[styles.latencyBadge, isPortrait && styles.hidden]}
        >
          <SymbolView
            name='clock'
            size={12}
            tintColor={theme.colorWhite}
            style={styles.latencyBadgeIcon}
          />
          <Text style={styles.latencyBadgeText}>
            {latencySeconds == null ? '--' : `${latencySeconds.toFixed(1)}s`}
          </Text>
        </View>
      </View>

      <View style={styles.centerControls}>
        <Button
          label={paused ? 'Play' : 'Pause'}
          style={[
            styles.playPauseButton,
            isPortrait && styles.playPauseButtonPortrait,
          ]}
          onPress={onPlayPausePress}
        >
          <SymbolView
            name={paused ? 'play.fill' : 'pause.fill'}
            size={44}
            tintColor={theme.colorWhite}
          />
        </Button>
      </View>

      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.48)', 'rgba(0,0,0,0.92)']}
        style={styles.bottomGradient}
        pointerEvents='none'
      />

      <View
        style={[
          styles.bottomControls,
          isPortrait && styles.bottomControlsPortrait,
          { paddingBottom: bottomOffset },
        ]}
      >
        <View style={styles.streamMetadataColumn}>
          <View
            style={[styles.liveRail, isPortrait && styles.liveRailPortrait]}
          >
            <View style={styles.liveIndicator}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
            <Text
              style={[
                styles.durationText,
                isPortrait && styles.durationTextPortrait,
              ]}
            >
              {durationLabel}
            </Text>
            <View
              style={[
                styles.viewerCountRow,
                isPortrait && styles.viewerCountRowPortrait,
              ]}
            >
              <SymbolView
                name='person'
                size={13}
                style={styles.userIcon}
                tintColor={theme.colorWhite}
              />
              <Text style={styles.viewerCountText}>
                {formatViewerCount(streamInfo?.viewerCount)}
              </Text>
            </View>
          </View>
          {streamInfo?.gameName && !isPortrait && (
            <Text numberOfLines={1} style={styles.categoryText}>
              {streamInfo.gameName}
            </Text>
          )}
        </View>

        <View style={styles.spacer} />
        {onRefresh && (
          <View style={styles.controlButtonContainer}>
            <Button
              label='Refresh'
              style={styles.controlButton}
              onPress={onRefresh}
            >
              <SymbolView
                name='arrow.clockwise'
                size={18}
                tintColor={theme.colorWhite}
              />
            </Button>
          </View>
        )}

        {onSharePress && (
          <View style={styles.controlButtonContainer}>
            <Button
              label='Share'
              style={styles.controlButton}
              onPress={onSharePress}
            >
              <SymbolView
                name='square.and.arrow.up'
                size={18}
                tintColor={theme.colorWhite}
              />
            </Button>
          </View>
        )}

        {showPipButton && onPipPress && (
          <View style={styles.controlButtonContainer}>
            <Button
              label='Picture in Picture'
              style={styles.controlButton}
              onPress={onPipPress}
            >
              <SymbolView name='pip' size={20} tintColor={theme.colorWhite} />
            </Button>
          </View>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  bottomControls: {
    alignItems: 'flex-end',
    bottom: 0,
    flexDirection: 'row',
    gap: theme.space8,
    left: 0,
    paddingHorizontal: theme.space20,
    paddingTop: 48,
    position: 'absolute',
    right: 0,
    zIndex: 1,
  },
  bottomControlsPortrait: {
    alignItems: 'center',
    bottom: theme.space8,
    paddingHorizontal: theme.space12,
    paddingTop: 0,
  },
  bottomGradient: {
    bottom: 0,
    height: 156,
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
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  controlButtonContainer: {
    alignItems: 'center',
    backgroundColor: 'rgba(22,22,22,0.58)',
    borderCurve: 'continuous',
    borderColor: 'rgba(255,255,255,0.18)',
    borderRadius: theme.borderRadius999,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    boxShadow: '0 8px 18px rgba(0, 0, 0, 0.28)',
    width: 44,
  },
  controlsOverlay: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  durationText: {
    color: theme.colorWhite,
    fontSize: theme.fontSize12,
    fontWeight: '600',
    opacity: 0.88,
  },
  durationTextPortrait: {
    fontSize: theme.fontSize11,
  },
  header: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: theme.space12,
    left: 0,
    paddingHorizontal: theme.space20,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 1,
  },
  headerPortrait: {
    alignItems: 'center',
    paddingHorizontal: theme.space12,
  },
  headerButton: {
    alignItems: 'center',
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  headerButtonContainer: {
    alignItems: 'center',
    backgroundColor: 'rgba(22,22,22,0.58)',
    borderCurve: 'continuous',
    borderColor: 'rgba(255,255,255,0.16)',
    borderRadius: theme.borderRadius999,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    boxShadow: '0 8px 18px rgba(0, 0, 0, 0.28)',
    width: 44,
  },
  latencyBadge: {
    alignItems: 'center',
    backgroundColor: 'rgba(22,22,22,0.52)',
    borderColor: 'rgba(255,255,255,0.16)',
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: theme.space8,
    minHeight: 32,
    paddingHorizontal: theme.space8,
    paddingVertical: theme.space4,
  },
  latencyBadgeIcon: {
    opacity: 0.9,
  },
  latencyBadgeText: {
    color: theme.colorWhite,
    fontSize: theme.fontSize11,
    fontWeight: '600',
  },
  hidden: {
    display: 'none',
  },
  liveRail: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.space8,
    minWidth: 0,
  },
  liveRailPortrait: {
    backgroundColor: 'rgba(0,0,0,0.36)',
    borderColor: 'rgba(255,255,255,0.10)',
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius999,
    borderWidth: 1,
    paddingHorizontal: theme.space8,
    paddingVertical: theme.space4,
  },
  liveDot: {
    backgroundColor: theme.colorRed,
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius999,
    height: 7,
    width: 7,
  },
  liveIndicator: {
    alignItems: 'center',
    backgroundColor: 'rgba(229,9,20,0.92)',
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius4,
    flexDirection: 'row',
    gap: theme.space8,
    paddingHorizontal: theme.space8,
    paddingVertical: 4,
  },
  liveText: {
    color: theme.colorWhite,
    fontSize: theme.fontSize11,
    fontWeight: '800',
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
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderColor: 'rgba(255,255,255,0.24)',
    borderRadius: 48,
    borderWidth: 1,
    height: 96,
    justifyContent: 'center',
    boxShadow: '0 18px 30px rgba(0, 0, 0, 0.42)',
    width: 96,
  },
  playPauseButtonPortrait: {
    borderRadius: 34,
    height: 68,
    width: 68,
  },
  spacer: {
    flex: 1,
  },
  streamMetadataColumn: {
    alignItems: 'flex-start',
    flex: 1,
    gap: theme.space8,
    minWidth: 0,
  },
  streamerNameTop: {
    color: theme.colorWhite,
    flex: 1,
    fontSize: theme.fontSize16,
    fontWeight: '800',
    opacity: 0.95,
  },
  headerMetadata: {
    flex: 1,
    gap: 2,
    justifyContent: 'center',
    minHeight: 44,
    minWidth: 0,
  },
  headerMetadataPortrait: {
    flex: 0,
    maxWidth: '52%',
  },
  streamTitleTop: {
    color: theme.colorWhite,
    fontSize: theme.fontSize12,
    fontWeight: '500',
    opacity: 0.74,
  },
  categoryText: {
    color: theme.colorWhite,
    fontSize: theme.fontSize12,
    fontWeight: '600',
    maxWidth: '85%',
    opacity: 0.72,
  },
  topGradient: {
    height: 132,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  userIcon: {
    opacity: 0.86,
  },
  viewerCountRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.space8,
  },
  viewerCountRowPortrait: {
    display: 'none',
  },
  viewerCountText: {
    color: theme.colorWhite,
    fontSize: theme.fontSize12,
    fontWeight: '600',
    opacity: 0.88,
  },
});
