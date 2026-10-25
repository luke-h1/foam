import { Platform } from 'react-native';

import { theme } from '@app/styles/themes';

const isIOS = Platform.OS === 'ios';

/**
 * Default for pushed/detail screens: compact title + back button.
 */
export const nativeStackScreenOptions = {
  headerShown: true,
  headerLargeTitle: false,
  headerTransparent: isIOS,
  headerLargeTitleShadowVisible: false,
  headerShadowVisible: false,
  headerTintColor: theme.colorWhite,
  headerStyle: isIOS
    ? undefined
    : { backgroundColor: theme.color.background.dark },
  contentStyle: { backgroundColor: theme.color.background.dark },
} as const;

/**
 * Tab root screens only: an iOS large title that collapses on scroll, set in
 * Montserrat. Pushed screens keep the system title font.
 */
export const nativeStackTabRootScreenOptions = {
  headerLargeTitle: isIOS,
  headerTransparent: isIOS,
  headerLargeTitleStyle: { fontFamily: theme.fontFamilyBold },
  headerTitleStyle: { fontFamily: theme.fontFamilyBold },
} as const;
