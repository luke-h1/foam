import { useKeyboardHandler } from 'react-native-keyboard-controller';
import { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';

const PADDING_BOTTOM = 15;

export const useGradualAnimation = () => {
  const height = useSharedValue(PADDING_BOTTOM);

  useKeyboardHandler(
    {
      onMove: e => {
        'worklet';

        height.value = Math.max(e.height, PADDING_BOTTOM);
      },
      onEnd: e => {
        'worklet';

        height.value = e.height;
      },
    },
    [],
  );

  const fakeView = useAnimatedStyle(() => {
    return {
      height: Math.abs(height.value),
      marginBottom: height.value > 0 ? 0 : PADDING_BOTTOM,
    };
  }, []);

  return {
    height,
    fakeView,
  };
};
