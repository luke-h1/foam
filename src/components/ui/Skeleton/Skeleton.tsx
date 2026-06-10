import { theme } from '@app/styles/themes';
import { Canvas, LinearGradient, Fill, vec } from '@shopify/react-native-skia';
import { useEffect } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import {
  Easing,
  useDerivedValue,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

interface SkeletonProps {
  shimmer?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

const SHIMMER_WIDTH = 180;
const SHIMMER_DURATION_MS = 1450;
const SHIMMER_COLORS = [
  'rgba(255,255,255,0)',
  'rgba(255,255,255,0.18)',
  'rgba(255,255,255,0)',
];

export function Skeleton({ shimmer = true, style, testID }: SkeletonProps) {
  return (
    <View style={[styles.skeleton, style]} testID={testID}>
      {shimmer ? <SkeletonShimmer /> : null}
    </View>
  );
}

/**
 * A single gradient band swept across the skeleton on the UI thread. The
 * canvas size is read via `onSize` so the sweep always covers the full
 * skeleton regardless of its measured width.
 */
function SkeletonShimmer() {
  const progress = useSharedValue(0);
  const size = useSharedValue({ width: 0, height: 0 });

  useEffect(() => {
    progress.set(
      withRepeat(
        withTiming(1, {
          duration: SHIMMER_DURATION_MS,
          easing: Easing.inOut(Easing.ease),
        }),
        -1,
      ),
    );
  }, [progress]);

  const start = useDerivedValue(() => {
    const sweepStart = -SHIMMER_WIDTH;
    const sweepEnd = size.value.width;
    return vec(sweepStart + (sweepEnd - sweepStart) * progress.value, 0);
  });

  const end = useDerivedValue(() => vec(start.value.x + SHIMMER_WIDTH, 0));

  return (
    <Canvas style={StyleSheet.absoluteFill} onSize={size} pointerEvents='none'>
      <Fill>
        <LinearGradient start={start} end={end} colors={SHIMMER_COLORS} />
      </Fill>
    </Canvas>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: theme.colorSurfaceAlpha,
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius16,
    overflow: 'hidden',
  },
});
