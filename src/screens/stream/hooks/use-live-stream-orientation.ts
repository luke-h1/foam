import { useEffect, useState } from 'react';
import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import * as ScreenOrientation from 'expo-screen-orientation';

import { getLiveStreamLayoutMetrics } from '../util/get-live-stream-layout-metrics';

/**
 * Window dims can stick after a rotation, so the native orientation event is
 * the tiebreaker. It only wins once the two have disagreed long enough to mean
 * "stuck" rather than "mid-rotation".
 */
const WINDOW_DIMS_STUCK_MS = 350;

function useDeviceLandscape(): boolean | null {
  const [deviceLandscape, setDeviceLandscape] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;

    const apply = (orientation: ScreenOrientation.Orientation) => {
      const isLandscape =
        orientation === ScreenOrientation.Orientation.LANDSCAPE_LEFT ||
        orientation === ScreenOrientation.Orientation.LANDSCAPE_RIGHT;

      const isPortrait =
        orientation === ScreenOrientation.Orientation.PORTRAIT_UP ||
        orientation === ScreenOrientation.Orientation.PORTRAIT_DOWN;

      if (active && (isLandscape || isPortrait)) {
        setDeviceLandscape(isLandscape);
      }
    };

    void ScreenOrientation.getOrientationAsync().then(apply);

    const subscription = ScreenOrientation.addOrientationChangeListener(event =>
      apply(event.orientationInfo.orientation),
    );

    return () => {
      active = false;
      ScreenOrientation.removeOrientationChangeListener(subscription);
    };
  }, []);

  return deviceLandscape;
}

function useWindowDimsAreStuck(deviceLandscape: boolean | null): boolean {
  const { width, height } = useWindowDimensions();
  const winLandscape = width > height;
  const [winStuck, setWinStuck] = useState(false);

  useEffect(() => {
    // Deriving this instead of resetting it does not work: the flag has to
    // clear the moment the two agree again, and a remembered "stuck" value
    // matches the next rotation's lagging window value and skips the wait.
    if (deviceLandscape === null || deviceLandscape === winLandscape) {
      // eslint-disable-next-line react-doctor/no-adjust-state-on-prop-change -- see above
      setWinStuck(false);
      return undefined;
    }

    const timer = setTimeout(() => setWinStuck(true), WINDOW_DIMS_STUCK_MS);
    return () => clearTimeout(timer);
  }, [deviceLandscape, winLandscape]);

  return winStuck;
}

/**
 * Resolves the orientation the screen should lay out for, and the metrics that
 * follow from it. Landscape puts the safe-area insets on left and right, so
 * those are reserved separately from the content width.
 */
export function useLiveStreamOrientation() {
  const { width: winW, height: winH } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const deviceLandscape = useDeviceLandscape();
  const winStuck = useWindowDimsAreStuck(deviceLandscape);

  const oriLandscape =
    winStuck && deviceLandscape !== null ? deviceLandscape : winW > winH;

  const sideLong = Math.max(winW, winH);
  const sideShort = Math.min(winW, winH);

  const { isLandscape, layoutHeight, portraitTopInset, screenWidth } =
    getLiveStreamLayoutMetrics({
      insetTop: Math.max(insets.top, insets.left, insets.right),
      windowHeight: oriLandscape ? sideShort : sideLong,
      windowWidth: oriLandscape ? sideLong : sideShort,
    });

  const landscapeInsetLeft = isLandscape ? insets.left : 0;
  const landscapeInsetRight = isLandscape ? insets.right : 0;

  return {
    contentWidth: Math.max(
      1,
      screenWidth - landscapeInsetLeft - landscapeInsetRight,
    ),
    insets,
    isLandscape,
    landscapeInsetLeft,
    landscapeInsetRight,
    layoutHeight,
    portraitTopInset,
    screenWidth,
  };
}
