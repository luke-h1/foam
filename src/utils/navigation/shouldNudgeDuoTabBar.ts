interface ShouldNudgeDuoTabBarOptions {
  hingePresent: boolean;
  platform: string;
  windowHeight: number;
  windowWidth: number;
}

/**
 * iPhone Duo's inner display, cold-launched in landscape, mounts NativeTabs
 * with no tab bar until a rotation. Hiding the bar and showing it again makes
 * UIKit populate the items. A phone has no hinge, so this stays off there.
 */
export function shouldNudgeDuoTabBar({
  hingePresent,
  platform,
  windowHeight,
  windowWidth,
}: ShouldNudgeDuoTabBarOptions): boolean {
  return platform === 'ios' && hingePresent && windowWidth > windowHeight;
}
