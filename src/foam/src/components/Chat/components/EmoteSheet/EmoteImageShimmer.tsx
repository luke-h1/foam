import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { LinearGradient } from 'expo-linear-gradient';

import { emoteSheetStyles as styles } from './emoteSheetStyles';

const SHIMMER_DURATION_MS = 1200;

export function EmoteImageShimmer({ size }: { size: number }) {
  const progress = useSharedValue(0);
  const shimmerWidth = Math.max(18, Math.round(size * 0.72));

  useEffect(() => {
    progress.set(
      withRepeat(
        withTiming(1, {
          duration: SHIMMER_DURATION_MS,
          easing: Easing.linear,
        }),
        -1,
        false,
      ),
    );

    return () => {
      cancelAnimation(progress);
    };
  }, [progress]);

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: -shimmerWidth + progress.get() * (size + shimmerWidth * 2),
      },
    ],
  }));

  return (
    <View
      pointerEvents='none'
      style={[styles.emoteImagePlaceholder, { height: size, width: size }]}
    >
      <Animated.View
        style={[
          styles.emoteImageShimmer,
          { height: size, width: shimmerWidth },
          shimmerStyle,
        ]}
      >
        <LinearGradient
          colors={[
            'rgba(255,255,255,0)',
            'rgba(255,255,255,0.11)',
            'rgba(255,255,255,0)',
          ]}
          locations={[0, 0.5, 1]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  );
}
