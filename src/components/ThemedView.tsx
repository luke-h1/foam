import useThemeColor from '@app/hooks/useThemeColor';
import { ViewProps } from '@app/types/style';
import { View } from 'react-native';
import Animated from 'react-native-reanimated';

export default function ThemedView({
  style,
  light,
  dark,
  animated,
  ...rest
}: ViewProps) {
  const backgroundColor = useThemeColor({
    light: light ?? 'transparent',
    dark: dark ?? 'transparent',
  });

  if (animated) {
    return <Animated.View style={[{ backgroundColor }, style]} {...rest} />;
  }

  return <View style={[{ backgroundColor }, style]} {...rest} />;
}
