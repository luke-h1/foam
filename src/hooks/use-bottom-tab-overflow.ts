import { use } from 'react';
import { Platform, useWindowDimensions } from 'react-native';

import { getHinge } from 'expo-hinge';
import { BottomTabBarHeightContext } from 'expo-router/build/layouts/Tabs';

import { CUSTOM_TAB_BAR_HEIGHT } from '@app/constants/tab-bar';
import { getBottomTabOverflow } from '@app/utils/navigation/getBottomTabOverflow';

export function useBottomTabOverflow() {
  const tabHeight = use(BottomTabBarHeightContext);

  // The window size changes on a fold or unfold, and the tab bar placement
  // changes with it.
  const { width, height } = useWindowDimensions();

  return getBottomTabOverflow({
    contextTabBarHeight: tabHeight ?? undefined,
    fallbackTabBarHeight: CUSTOM_TAB_BAR_HEIGHT,
    hingePresent: getHinge() != null,
    platform: Platform.OS,
    windowHeight: height,
    windowWidth: width,
  });
}
