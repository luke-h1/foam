import { useColorScheme } from 'react-native';

export default function useThemeColor<T, U>(props: {
  light: T;
  dark: U;
}): T | U {
  const theme = useColorScheme() ?? 'light';
  return props[theme];
}
