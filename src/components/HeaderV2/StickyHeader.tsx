import Animated, {
  SharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { HeaderV2, HeaderV2Props } from './HeaderV2';

type StickyHeaderProps = HeaderV2Props & {
  visible: SharedValue<boolean>;
};

export function StickyHeader({ visible, ...props }: StickyHeaderProps) {
  const style = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: withTiming(visible.get() ? 0 : -200),
      },
    ],
    zIndex: 1000,
  }));

  return (
    <Animated.View style={style}>
      <HeaderV2 {...props} />
    </Animated.View>
  );
}
