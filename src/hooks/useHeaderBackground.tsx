import { useEffect } from 'react';
import Animated, {
  SharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';

interface Props {
  offsetY: SharedValue<number>;
}

export const useHeaderBackground = ({ offsetY }: Props) => {
  const rightContainerStyle = useAnimatedStyle(() => {
    return {
      borderBottomWidth: withTiming(offsetY.value > 0 ? 0.5 : 0, {
        duration: 200,
      }),
    };
  });

  // useEffect(() => {
  //   navigation.setOptions({
  //     headerBackground: () => (
  //       <Animated.View
  //         style={[
  //           rightContainerStyle,
  //           {
  //             borderColor: colorKit.setAlpha('#ffffff', 0.1).hex(),
  //           },
  //         ]}
  //       />
  //     ),
  //   });
  // }, [navigation, rightContainerStyle]);
};
