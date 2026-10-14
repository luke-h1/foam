import { StyleSheet } from 'react-native';
import { Pressable } from 'react-native-gesture-handler';
import Animated, {
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { pressAnimation } from '@app/styles/motion';

import type { PressableAreaProps } from './pressable-area.types';

/**
 * The press lives in a shared value, not in React state. List rows use this,
 * and a press must not re-render the row.
 */
export function PressableArea({
  ref,
  children,
  onPressIn,
  onPressOut,
  feedback = 'dim',
  ...rest
}: PressableAreaProps) {
  const pressed = useSharedValue(0);

  const feedbackStyle = useAnimatedStyle(() =>
    feedback === 'highlight'
      ? {
          backgroundColor: interpolateColor(
            pressed.get(),
            [0, 1],
            ['rgba(255, 255, 255, 0)', 'rgba(255, 255, 255, 0.08)'],
          ),
        }
      : { opacity: interpolate(pressed.get(), [0, 1], [1, 0.75]) },
  );

  return (
    <Pressable
      accessibilityRole='button'
      {...rest}
      ref={ref}
      onPressIn={e => {
        pressed.set(withTiming(1, pressAnimation));
        onPressIn?.(e);
      }}
      onPressOut={e => {
        pressed.set(withTiming(0, pressAnimation));
        onPressOut?.(e);
      }}
    >
      <Animated.View style={[styles.pressable, feedbackStyle]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    alignSelf: 'stretch',
  },
});
