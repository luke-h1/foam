import useThemeColor from '@app/hooks/useThemeColor';
import theme from '@app/styles/theme';
import { ThemeProps } from '@app/types/style';
import { Text, TextStyle } from 'react-native';
import Animated from 'react-native-reanimated';

export type TextProps = ThemeProps &
  Text['props'] & {
    marginBottom?: number;
    fontSize?: TextStyle['fontSize'];
    fontWeight?: 'light' | 'medium' | 'bold';
    italic?: boolean;
    animated?: boolean;
  };

export default function ThemedText({
  style,
  light,
  dark,
  marginBottom = 0,
  fontSize = theme.fontSize.sm,
  fontWeight,
  italic,
  animated,
  ...rest
}: TextProps) {
  const color = useThemeColor({
    light: light ?? theme.color.black,
    dark: dark ?? theme.color.white,
  });

  const fontFamily = (() => {
    if (fontWeight === 'light') {
      return italic ? theme.fontFamily.lightItalic : theme.fontFamily.light;
    }
    if (fontWeight === 'bold') {
      return italic ? theme.fontFamily.boldItalic : theme.fontFamily.bold;
    }
    return italic ? theme.fontFamily.italic : theme.fontFamily.regular;
  })();

  if (animated) {
    return (
      <Animated.Text
        style={[{ color, marginBottom, fontSize, fontFamily }, style]}
        {...rest}
      />
    );
  }

  return (
    <Text
      style={[{ color, marginBottom, fontSize, fontFamily }, style]}
      {...rest}
    />
  );
}
