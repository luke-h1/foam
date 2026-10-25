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
 * Drive feedback from Pressable `onPressIn` / `onPressOut`. A child
 * `Gesture.Manual` detector steals the touch and the card highlight flashes
 * without firing `onPress`.
 */
export function PressableArea({
  ref,
  children,
  disabled,
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
      {...(ref !== undefined ? { ref } : {})}
      {...(disabled !== undefined ? { disabled } : {})}
      onPressIn={e => {
        if (disabled !== true) {
          pressed.set(withTiming(1, pressAnimation));
        }

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
