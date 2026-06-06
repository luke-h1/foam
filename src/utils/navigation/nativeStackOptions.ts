import { theme } from '@app/styles/themes';
import { Platform } from 'react-native';

const isIOS = Platform.OS === 'ios';

/** Default for pushed/detail screens: compact title + back button. */
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

/** Tab root screens only: iOS large title that collapses on scroll. */
export const nativeStackTabRootScreenOptions = {
  headerLargeTitle: isIOS,
  headerTransparent: isIOS,
} as const;
