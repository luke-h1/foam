interface LiveStreamWindowSize {
  height: number;
  width: number;
}

interface ResolveLiveStreamWindowSizeOptions {
  deviceLandscape: boolean | null;
  trustDeviceOrientation: boolean;
  windowDimsStuck: boolean;
  windowHeight: number;
  windowWidth: number;
}

/**
 * The space the player draws into.
 *
 * On iOS 26 and earlier, window size can lag a rotation the lock did accept, so
 * a stuck window yields to the device orientation. On iOS 27 a lock is only a
 * preference while the window is resizable, and the orientation API can disagree
 * with the window (iPhone Mirroring always reports portrait). The window size is
 * the ground truth there.
 */
export function resolveLiveStreamWindowSize({
  deviceLandscape,
  trustDeviceOrientation,
  windowDimsStuck,
  windowHeight,
  windowWidth,
}: ResolveLiveStreamWindowSizeOptions): LiveStreamWindowSize {
  const useDeviceOrientation =
    trustDeviceOrientation && windowDimsStuck && deviceLandscape !== null;

  if (!useDeviceOrientation) {
    return { height: windowHeight, width: windowWidth };
  }

  const sideLong = Math.max(windowWidth, windowHeight);
  const sideShort = Math.min(windowWidth, windowHeight);

  if (deviceLandscape) {
    return { height: sideShort, width: sideLong };
  }

  return { height: sideLong, width: sideShort };
}

export function trustDeviceOrientationOnPlatform(
  platform: string,
  osVersion: string | number,
): boolean {
  if (platform !== 'ios') {
    return true;
  }

  return Number.parseInt(String(osVersion), 10) < 27;
}
