const DUO_INNER_DISPLAY_MIN_WIDTH = 600;

interface GetBottomTabOverflowOptions {
  contextTabBarHeight: number | undefined;
  fallbackTabBarHeight: number;
  hingePresent: boolean;
  platform: string;
  windowHeight: number;
  windowWidth: number;
}

export function getBottomTabOverflow({
  contextTabBarHeight,
  fallbackTabBarHeight,
  hingePresent,
  platform,
  windowHeight,
  windowWidth,
}: GetBottomTabOverflowOptions): number {
  if (contextTabBarHeight != null) {
    return contextTabBarHeight;
  }

  const isDuoInnerPortrait =
    windowHeight > windowWidth && windowWidth >= DUO_INNER_DISPLAY_MIN_WIDTH;

  if (platform === 'ios' && hingePresent && !isDuoInnerPortrait) {
    return 0;
  }

  return fallbackTabBarHeight;
}
