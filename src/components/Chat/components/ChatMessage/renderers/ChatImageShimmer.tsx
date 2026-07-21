import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

const PULSE_DURATION_MS = 750;
const PULSE_MIN = 0.35;
const PULSE_MAX = 0.85;

/**
 * Fills its (relatively/absolutely positioned) parent with a grey box that
 * pulses on the UI thread while an inline chat image loads, so a not-yet-decoded
 * emote/badge reads as "loading" instead of a dead grey square. One Animated.View
 * + one shared value - no gradient/canvas - because a busy chat can have many
 * loading at once. When `animate` is false (the image gave up after retries) it
 * settles to a static grey so a permanently-broken image still shows a box.
 */
export function ChatImageShimmer({ animate = true }: { animate?: boolean }) {
  const opacity = useSharedValue(PULSE_MIN);

  useEffect(() => {
    if (!animate) {
      cancelAnimation(opacity);
      opacity.set(PULSE_MIN);
      return;
    }
    opacity.set(
      withRepeat(
        withTiming(PULSE_MAX, {
          duration: PULSE_DURATION_MS,
          easing: Easing.inOut(Easing.ease),
        }),
        -1,
        true,
      ),
    );
    return () => {
      cancelAnimation(opacity);
    };
  }, [animate, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.get() }));

  return (
    <Animated.View
      pointerEvents='none'
      style={[StyleSheet.absoluteFill, styles.fill, animatedStyle]}
      testID='chat-image-shimmer'
    />
  );
}

const styles = StyleSheet.create({
  fill: {
    backgroundColor: 'rgba(255, 255, 255, 0.13)',
    borderRadius: 4,
  },
});
