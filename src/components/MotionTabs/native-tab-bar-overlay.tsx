import { GlassView } from 'expo-glass-effect';
import { router, usePathname } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { memo, useMemo } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TabToolbar } from './components/tab-toolbar';
import type { MotionTabItem, NativeTabBarOverlayItem } from './types';
import { CUSTOM_TAB_BAR_HEIGHT } from './constants';
import { layoutStyles as styles } from './utils/layout-styles';
import { palette } from './utils/palette';

type NativeTabBarOverlayProps = {
  items: NativeTabBarOverlayItem[];
};

const NativeTabBarOverlay = memo(function NativeTabBarOverlay({
  items,
}: NativeTabBarOverlayProps) {
  const colors = palette('dark');
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const activeRouteName = getActiveRouteName(pathname);
  const motionItems = useMemo(
    () =>
      items.map(item => ({
        icon: (_focused: boolean, color: string, size: number) => (
          <SymbolView name={item.iconName} tintColor={color} size={size} />
        ),
        key: item.key,
        label: item.label,
        routeName: item.routeName,
      })),
    [items],
  );
  const activeItem = motionItems.find(
    item => item.routeName === activeRouteName,
  );

  const handlePress = (item: MotionTabItem): void => {
    if (item.routeName !== activeRouteName) {
      router.navigate(`/tabs/${item.routeName}`);
    }
  };

  return (
    <View
      pointerEvents="box-none"
      style={[StyleSheet.absoluteFill, styles.root]}
    >
      <View
        pointerEvents="box-none"
        style={[
          styles.dock,
          {
            height: CUSTOM_TAB_BAR_HEIGHT + insets.bottom,
            paddingBottom: Math.max(insets.bottom, 12),
          },
        ]}
      >
        <View style={styles.cardShadow}>
          <GlassView
            glassEffectStyle="regular"
            style={[
              styles.card,
              {
                borderColor: colors.border,
                ...Platform.select({
                  android: {
                    backgroundColor: colors.surface,
                  },
                }),
              },
            ]}
          >
            <TabToolbar
              activeKey={activeItem?.key}
              colors={colors}
              items={motionItems}
              onPress={handlePress}
            />
          </GlassView>
        </View>
      </View>
    </View>
  );
});

function getActiveRouteName(pathname: string): string | undefined {
  return pathname.split('/').filter(Boolean)[1];
}

export { NativeTabBarOverlay };
