import type { AnimatedTabBarProps, MotionTabItem } from '../types';

function getNavItems({
  descriptors,
  state,
}: Pick<AnimatedTabBarProps, 'descriptors' | 'state'>): MotionTabItem[] {
  return state.routes
    .map(route => {
      const options = descriptors[route.key]?.options;
      if ((options as { href?: unknown })?.href === null) {
        return null;
      }

      const label =
        typeof options?.tabBarLabel === 'string'
          ? options.tabBarLabel
          : (options?.title ?? route.name);

      const item: MotionTabItem = {
        icon: (focused, color, size) =>
          options?.tabBarIcon?.({ focused, color, size }) ?? null,
        key: route.key,
        label,
        routeName: route.name,
      };

      return item;
    })
    .filter((item): item is MotionTabItem => item !== null);
}

export { getNavItems };
