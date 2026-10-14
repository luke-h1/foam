import { StyleSheet } from 'react-native';
import {
  Gesture,
  GestureDetector,
  Pressable,
} from 'react-native-gesture-handler';
import Animated, {
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { pressAnimation } from '@app/styles/motion';

import type { PressableAreaProps } from './pressable-area.types';

export function PressableArea({
  ref,
  children,
  disabled,
  feedback = 'dim',
  ...rest
}: PressableAreaProps) {
  const pressed = useSharedValue(0);

  const pressFeedback = Gesture.Manual()
    .enabled(disabled !== true)
    .onTouchesDown(() => {
      pressed.set(withTiming(1, pressAnimation));
    })
    .onTouchesUp(() => {
      pressed.set(withTiming(0, pressAnimation));
    })
    .onTouchesCancelled(() => {
      pressed.set(withTiming(0, pressAnimation));
    });

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
      disabled={disabled}
      simultaneousWithExternalGesture={pressFeedback}
    >
      <GestureDetector gesture={pressFeedback}>
        <Animated.View style={[styles.pressable, feedbackStyle]}>
          {children}
        </Animated.View>
      </GestureDetector>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    alignSelf: 'stretch',
  },
});
