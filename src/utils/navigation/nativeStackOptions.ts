import { Platform } from 'react-native';

import { theme } from '@app/styles/themes';

const isIOS = Platform.OS === 'ios';

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

export const nativeStackTabRootScreenOptions = {
  headerLargeTitle: isIOS,
  headerTransparent: isIOS,
  headerLargeTitleStyle: { fontFamily: theme.fontFamilyBold },
  headerTitleStyle: { fontFamily: theme.fontFamilyBold },
} as const;
