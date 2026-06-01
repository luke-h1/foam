import { GlassView } from 'expo-glass-effect';
import { memo } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { TabToolbar } from './components/tab-toolbar';
import { getNavItems } from './utils/nav-items';
import type { AnimatedTabBarProps, MotionTabItem } from './types';
import { layoutStyles as styles } from './utils/layout-styles';
import { palette } from './utils/palette';

const AnimatedTabBar = memo(function AnimatedTabBar(
  props: AnimatedTabBarProps,
) {
  const { descriptors, insets, navigation, state } = props;
  const colors = palette('dark');
  const items = getNavItems({ descriptors, state });
  const activeRoute = state.routes[state.index];
  const activeKey = activeRoute?.key;

  const handlePress = (item: MotionTabItem, index: number): void => {
    const isFocused = state.index === index;
    if (!isFocused) {
      navigation.navigate(item.routeName);
    }
  };

  return (
    <View
      pointerEvents='box-none'
      style={[StyleSheet.absoluteFill, styles.root]}
    >
      <View
        pointerEvents='box-none'
        style={[styles.dock, { paddingBottom: Math.max(insets.bottom, 12) }]}
      >
        <View style={styles.cardShadow}>
          <GlassView
            glassEffectStyle='regular'
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
              activeKey={activeKey}
              colors={colors}
              items={items}
              onPress={handlePress}
            />
          </GlassView>
        </View>
      </View>
    </View>
  );
});

export { AnimatedTabBar };
