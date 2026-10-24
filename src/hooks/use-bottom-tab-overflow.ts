import { use } from 'react';

import { BottomTabBarHeightContext } from 'expo-router/build/layouts/Tabs';

import { CUSTOM_TAB_BAR_HEIGHT } from '@app/constants/tab-bar';

export function useBottomTabOverflow() {
  const tabHeight = use(BottomTabBarHeightContext);
  return tabHeight ?? CUSTOM_TAB_BAR_HEIGHT;
}
