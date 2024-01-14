import React, { useEffect } from 'react';
import {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { ColorTokens } from 'tamagui';
import { AnimatedFlex } from '../Flex';
import { Icons } from '../icons';

interface SpinnerProps {
  size: number;
  disabled?: boolean;
  color?: ColorTokens;
}

const Spinner = ({ size, color, disabled }: SpinnerProps) => {
  const rotation = useSharedValue(0);

  const animatedStyles = useAnimatedStyle(() => {
    return {
      transform: [
        {
          rotateZ: `${rotation.value}deg`,
        },
      ],
    };
  }, [rotation.value]);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, {
        duration: 1000,
        easing: Easing.bezier(0.83, 0, 0.17, 1),
      }),
      -1,
    );
    return () => cancelAnimation(rotation);
  }, [rotation]);

  if (disabled) {
    return <Icons.EmptySpinner color="$neutral3" size={size} />;
  }

  return (
    <AnimatedFlex style={[animatedStyles]}>
      <Icons.CircleSpinner color={color ?? '$neutral2'} size={size} />
    </AnimatedFlex>
  );
};

export default Spinner;
