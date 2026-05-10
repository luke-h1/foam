import { colors } from '@app/styles/colors';
import { useColorScheme } from 'react-native';

type ThemeName = keyof typeof colors;
type ThemeColorName = keyof (typeof colors)[ThemeName];

export function useThemeColor(
  colorName: ThemeColorName,
  props: { light?: string; dark?: string } = {},
) {
  const theme: ThemeName = useColorScheme() === 'dark' ? 'dark' : 'light';

  return props[theme] ?? colors[theme][colorName];
}
