import { use } from 'react';

import { BottomTabBarHeightContext } from 'expo-router/build/react-navigation/bottom-tabs';

import { CUSTOM_TAB_BAR_HEIGHT } from '@app/components/MotionTabs/constants';

export function useBottomTabOverflow() {
  const tabHeight = use(BottomTabBarHeightContext);
  return tabHeight ?? CUSTOM_TAB_BAR_HEIGHT;
}
