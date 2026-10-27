import { useEffect, useState } from 'react';
import { Dimensions, Platform } from 'react-native';

import { getHinge } from 'expo-hinge';

import { shouldNudgeDuoTabBar } from '@app/utils/navigation/shouldNudgeDuoTabBar';

function readShouldNudgeDuoTabBar(): boolean {
  // oxlint-disable-next-line react-doctor/rn-no-dimensions-get -- one read at cold launch; a subscription would hide the bar again on rotation
  const { height, width } = Dimensions.get('window');

  return shouldNudgeDuoTabBar({
    hingePresent: getHinge() != null,
    platform: Platform.OS,
    windowHeight: height,
    windowWidth: width,
  });
}

/**
 * Hides the tab bar for one frame on a landscape Duo cold launch, then shows
 * it. That hidden-to-visible change is what makes the missing bar appear.
 * The check runs once, so a later rotation does not hide the bar again.
 */
export function useDuoLandscapeTabBarNudge(): boolean {
  const [hidden, setHidden] = useState(readShouldNudgeDuoTabBar);

  useEffect(() => {
    if (!hidden) {
      return undefined;
    }

    const frame = requestAnimationFrame(() => {
      setHidden(false);
    });

    return () => {
      cancelAnimationFrame(frame);
    };
  }, [hidden]);

  return hidden;
}
