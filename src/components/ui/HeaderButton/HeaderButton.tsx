import { theme } from '@app/styles/themes';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import type { ComponentProps } from 'react';
import { Pressable } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { HeaderButtonProps } from './HeaderButton.ios';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const MATERIAL_ICON_FALLBACK = 'close';
const sfToMaterial: Record<
  string,
  ComponentProps<typeof MaterialCommunityIcons>['name']
> = {
  xmark: 'close',
  'chevron.left': 'chevron-left',
  'chevron.right': 'chevron-right',
  'chevron.up': 'chevron-up',
  'chevron.down': 'chevron-down',
  plus: 'plus',
  trash: 'trash-can-outline',
  gear: 'cog',
  ellipsis: 'dots-horizontal',
};

export function HeaderButton({ imageProps, buttonProps }: HeaderButtonProps) {
  const scale = useSharedValue(1);
  const iconName =
    sfToMaterial[imageProps?.systemName ?? 'xmark'] ?? MATERIAL_ICON_FALLBACK;

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
      <MaterialCommunityIcons
        name={iconName}
        size={theme.fontSize18}
        color={imageProps?.color || theme.color.text.dark}
      />
    </AnimatedPressable>
  );
}
