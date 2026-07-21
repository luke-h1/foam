import { Platform, useColorScheme } from 'react-native';

import { theme } from '@app/styles/themes';

const isIOS = Platform.OS === 'ios';

/**
 * Default for pushed/detail screens: compact title + back button. Resolved
 * per scheme, so consume from a component via useNativeStackScreenOptions().
 */
export function useNativeStackScreenOptions() {
  const colorScheme = useColorScheme();
  const scheme = colorScheme === 'light' ? 'light' : 'dark';
  return {
    headerShown: true,
    headerLargeTitle: false,
    headerTransparent: isIOS,
    headerLargeTitleShadowVisible: false,
    headerShadowVisible: false,
    headerTintColor: theme.color.text[scheme],
    headerStyle: isIOS
      ? undefined
      : { backgroundColor: theme.color.background[scheme] },
    contentStyle: { backgroundColor: theme.color.background[scheme] },
  } as const;
}

/**
 * Tab root screens only: iOS large title that collapses on scroll.
 */
export const nativeStackTabRootScreenOptions = {
  headerLargeTitle: isIOS,
  headerTransparent: isIOS,
} as const;
