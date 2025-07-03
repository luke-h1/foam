import { PropsWithChildren, Ref, forwardRef } from 'react';
// eslint-disable-next-line no-restricted-imports
import { Pressable, PressableProps, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const PressableArea = forwardRef(
  (props: PropsWithChildren<PressableProps>, ref: Ref<View>) => {
    const opacity = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
      opacity: opacity.value,
    }));

    return (
      <AnimatedPressable
        {...props}
        ref={ref}
        style={[props.style, animatedStyle]}
        onPressIn={() => {
          opacity.value = withTiming(0.75, { duration: 150 });
        }}
        onPressOut={() => {
          opacity.value = withTiming(1, { duration: 150 });
        }}
      />
    );
  },
);
PressableArea.displayName = 'PressableArea';
