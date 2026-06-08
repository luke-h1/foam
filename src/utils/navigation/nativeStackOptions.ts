import { theme } from '@app/styles/themes';
import type { NativeStackNavigationOptions } from 'expo-router/build/react-navigation/native-stack';
import { Platform } from 'react-native';

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
} satisfies NativeStackNavigationOptions;

/**
 * Root screens - enables IOS large title that collapses under status bar / dynamic island on scroll
 */
export const nativeStackTabRootScreenOptions = {
  headerLargeTitle: isIOS,
  headerTransparent: isIOS,
} satisfies NativeStackNavigationOptions;
