import {
  type StyleProp,
  StyleSheet,
  useColorScheme,
  type ViewStyle,
} from 'react-native';
import Animated from 'react-native-reanimated';

import { LinearGradient } from 'expo-linear-gradient';

import { theme } from '@app/styles/themes';

import { SHIMMER_GRADIENT_COLORS } from './shimmerGradient';

interface SkeletonProps {
  shimmer?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function Skeleton({ shimmer = true, style, testID }: SkeletonProps) {
  const colorScheme = useColorScheme();
  const scheme = colorScheme === 'light' ? 'light' : 'dark';
  return (
    <Animated.View
      style={[
        styles.skeleton,
        { backgroundColor: theme.color.surfaceAlpha[scheme] },
        style,
      ]}
      testID={testID}
    >
      {shimmer ? (
        <Animated.View
          pointerEvents='none'
          style={[styles.shimmer, shimmerAnimationStyle]}
        >
          <LinearGradient
            colors={SHIMMER_GRADIENT_COLORS}
            locations={[0, 0.5, 1]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      ) : null}
    </Animated.View>
  );
}

const shimmerSweep = {
  '0%': {
    opacity: 0.2,
    transform: [{ translateX: -180 }],
  },
  '35%': {
    opacity: 0.85,
  },
  '100%': {
    opacity: 0.2,
    transform: [{ translateX: 520 }],
  },
};

const shimmerAnimationStyle = {
  animationDuration: '1450ms',
  animationIterationCount: 'infinite',
  animationName: shimmerSweep,
  animationTimingFunction: 'ease-in-out',
} as const;

const styles = StyleSheet.create({
  shimmer: {
    bottom: 0,
    position: 'absolute',
    top: 0,
    width: 180,
  },
  skeleton: {
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius16,
    overflow: 'hidden',
  },
});
