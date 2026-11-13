/**
 * The iPhone Duo outer display is 466pt wide and the inner display is 669pt
 * wide in portrait. 600 separates the two.
 */
const DUO_INNER_DISPLAY_MIN_WIDTH = 600;

interface GetBottomTabOverflowOptions {
  /**
   * Height from `BottomTabBarHeightContext`. Only the JS tabs navigator
   * provides it; `NativeTabs` never does.
   */
  contextTabBarHeight: number | undefined;
  fallbackTabBarHeight: number;
  hingePresent: boolean;
  platform: string;
  windowHeight: number;
  windowWidth: number;
}

/**
 * How much bottom space the tab bar takes from a tab screen. On the iPhone
 * Duo, iOS side-mounts the native tab bar in every posture except the inner
 * display in portrait, which keeps a bottom bar (verified on the simulator).
 * A side-mounted bar takes no bottom space, so the overflow is zero there.
 */
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
