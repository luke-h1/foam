import { useEffect, useState } from 'react';
import {
  type LayoutChangeEvent,
  type StyleProp,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { LinearGradient } from 'expo-linear-gradient';

import { useScreenFocused } from '@app/hooks/useScreenFocused';
import { theme } from '@app/styles/themes';

interface SkeletonProps {
  shimmer?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

const SHIMMER_WIDTH = 180;
const SHIMMER_DURATION_MS = 1450;

export function Skeleton({ shimmer = true, style, testID }: SkeletonProps) {
  const [width, setWidth] = useState(0);

  return (
    <View
      style={[styles.skeleton, style]}
      testID={testID}
      onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
    >
      {shimmer ? <SkeletonShimmer containerWidth={width} /> : null}
    </View>
  );
}

/**
 * A gradient band swept across the skeleton via a single `translateX` (no Skia
 * canvas, so many skeletons render without separate TextureViews). Pauses while
 * off-screen.
 */
function SkeletonShimmer({ containerWidth }: { containerWidth: number }) {
  const focused = useScreenFocused();
  const translateX = useSharedValue(-SHIMMER_WIDTH);

  useEffect(() => {
    if (!focused || containerWidth <= 0) {
      cancelAnimation(translateX);
      return;
    }

    translateX.set(-SHIMMER_WIDTH);
    translateX.set(
      withRepeat(
        withTiming(containerWidth, {
          duration: SHIMMER_DURATION_MS,
          easing: Easing.inOut(Easing.ease),
        }),
        -1,
      ),
    );

    return () => cancelAnimation(translateX);
  }, [focused, containerWidth, translateX]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.get() }],
  }));

  return (
    <Animated.View pointerEvents='none' style={[styles.shimmer, animatedStyle]}>
      <LinearGradient
        colors={[
          'rgba(255,255,255,0)',
          'rgba(255,255,255,0.18)',
          'rgba(255,255,255,0)',
        ]}
        locations={[0, 0.5, 1]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={StyleSheet.absoluteFill}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  shimmer: {
    bottom: 0,
    position: 'absolute',
    top: 0,
    width: SHIMMER_WIDTH,
  },
  skeleton: {
    backgroundColor: theme.colorSurfaceAlpha,
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius16,
    overflow: 'hidden',
  },
});
