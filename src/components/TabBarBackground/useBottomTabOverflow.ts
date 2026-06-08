import { CUSTOM_TAB_BAR_HEIGHT } from '@app/components/MotionTabs/constants';
import { BottomTabBarHeightContext } from 'expo-router/build/react-navigation/bottom-tabs';
import { use } from 'react';

export function useBottomTabOverflow() {
  const tabHeight = use(BottomTabBarHeightContext);
  return tabHeight ?? CUSTOM_TAB_BAR_HEIGHT;
}
