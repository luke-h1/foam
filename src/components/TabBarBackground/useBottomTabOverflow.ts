import { BottomTabBarHeightContext } from 'expo-router/build/react-navigation/bottom-tabs';
import { use } from 'react';

export function useBottomTabOverflow() {
  const tabHeight = use(BottomTabBarHeightContext);
  return tabHeight ?? 104;
}
