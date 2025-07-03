import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import { StyleSheet } from 'react-native';

export function BlurTabBarBackground() {
  return (
    <BlurView
      // System chrome material automatically adapts to the system's theme
      // and matches the native tab bar appearance on iOS.
      tint="systemChromeMaterial"
      intensity={100}
      style={StyleSheet.absoluteFill}
    />
  );
}

export function useBottomTabOverflow() {
  let tabHeight = 0;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    tabHeight = useBottomTabBarHeight();
  } catch {
    /* empty */
  }

  return tabHeight;
}
