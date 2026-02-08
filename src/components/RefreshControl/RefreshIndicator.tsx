import {
  IconSymbol,
  IconSymbolName,
} from '@app/components/IconSymbol/IconSymbol';
import { REFRESH_THRESHOLD } from '@app/hooks/useRefresh';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

const INDICATOR_SIZE = 36;
const ICON_NAME: IconSymbolName = 'arrow.down';

interface RefreshIndicatorProps {
  scrollY: SharedValue<number>;
  isRefreshing: boolean;
}

export function RefreshIndicator({
  scrollY,
  isRefreshing,
}: RefreshIndicatorProps) {
  const { theme } = useUnistyles();
  const refreshProgress = useSharedValue(0);

  useEffect(() => {
    refreshProgress.value = withTiming(isRefreshing ? 1 : 0, { duration: 200 });
  }, [isRefreshing, refreshProgress]);

  const containerStyle = useAnimatedStyle(() => {
    const pullAmount = Math.abs(Math.min(scrollY.value, 0));
    const rp = refreshProgress.value;

    const pullTranslateY = interpolate(
      pullAmount,
      [0, REFRESH_THRESHOLD],
      [-INDICATOR_SIZE - 8, 8],
      Extrapolation.CLAMP,
    );
    const translateY = pullTranslateY * (1 - rp) + 8 * rp;

    const pullOpacity = interpolate(
      pullAmount,
      [0, REFRESH_THRESHOLD * 0.3, REFRESH_THRESHOLD],
      [0, 0.3, 1],
      Extrapolation.CLAMP,
    );
    const opacity = pullOpacity * (1 - rp) + 1 * rp;

    return {
      opacity,
      transform: [{ translateY }],
    };
  });

  const arrowStyle = useAnimatedStyle(() => {
    const pullAmount = Math.abs(Math.min(scrollY.value, 0));
    const rotation = interpolate(
      pullAmount,
      [0, REFRESH_THRESHOLD],
      [0, 180],
      Extrapolation.CLAMP,
    );

    return {
      opacity: interpolate(refreshProgress.value, [0, 1], [1, 0]),
      transform: [{ rotate: `${rotation}deg` }],
    };
  });

  const spinnerStyle = useAnimatedStyle(() => ({
    opacity: refreshProgress.value,
  }));

  const accentColor = theme.colors.grass.accent;

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      <View style={[styles.badge, { backgroundColor: theme.colors.gray.ui }]}>
        <Animated.View style={[styles.centered, arrowStyle]}>
          <IconSymbol name={ICON_NAME} size={18} color={accentColor} />
        </Animated.View>
        <Animated.View style={[styles.centered, spinnerStyle]}>
          <ActivityIndicator size="small" color={accentColor} />
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: INDICATOR_SIZE / 2,
    height: INDICATOR_SIZE,
    justifyContent: 'center',
    width: INDICATOR_SIZE,
  },
  centered: {
    position: 'absolute',
  },
  container: {
    alignItems: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 10,
  },
});
