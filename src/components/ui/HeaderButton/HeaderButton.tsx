import { theme } from '@app/styles/themes';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { Pressable } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { HeaderButtonProps } from './HeaderButton.ios';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const sfSymbolFallback = 'xmark';
const headerSymbols: Record<string, SymbolViewProps['name']> = {
  xmark: 'xmark',
  'chevron.left': 'chevron.left',
  'chevron.right': 'chevron.right',
  'chevron.up': 'chevron.up',
  'chevron.down': 'chevron.down',
  plus: 'plus',
  trash: 'trash',
  gear: 'gear',
  ellipsis: 'ellipsis',
};

export function HeaderButton({ imageProps, buttonProps }: HeaderButtonProps) {
  const scale = useSharedValue(1);
  const iconName =
    headerSymbols[imageProps?.systemName ?? sfSymbolFallback] ??
    sfSymbolFallback;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      hitSlop={20}
      onPress={buttonProps?.onPress}
      onPressIn={() => {
        scale.value = withTiming(0.8);
      }}
      onPressOut={() => {
        scale.value = withTiming(1);
      }}
      style={animatedStyle}
    >
      <SymbolView
        name={iconName}
        size={theme.fontSize18}
        tintColor={imageProps?.color || theme.color.text.dark}
      />
    </AnimatedPressable>
  );
}
