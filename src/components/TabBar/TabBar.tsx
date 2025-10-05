import { TabParamList } from '@app/navigators';
import { type BottomTabBarProps } from '@bottom-tabs/react-navigation';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import { SFSymbol, SymbolView } from 'expo-symbols';
import { View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Button } from '../Button';
import { Typography } from '../Typography';

const icons: Record<keyof TabParamList, SFSymbol> = {
  Following: 'heart',
  Search: 'sparkle.magnifyingglass',
  Settings: 'gear',
  Top: 'arrowshape.up',
};

export function TabBar(props: BottomTabBarProps) {
  const { descriptors, navigation, state } = props;

  const router = useRouter();

  const gesture = Gesture.Pan().onEnd(event => {
    if (event.translationX > 100) {
      runOnJS(router.back)();
    }
  });

  const { theme } = useUnistyles();

  return (
    <GestureDetector gesture={gesture}>
      <BlurView
        intensity={75}
        style={styles.main}
        tint={
          theme.name === 'dark'
            ? 'systemThickMaterialDark'
            : 'systemThickMaterialLight'
        }
      >
        {state.routes.map((route, index) => {
          const options = descriptors[route.key]?.options;
          const focused = state.index === index;

          // Type assertion to fix TS error: route.name is string, but we know it's keyof TabParamList
          const icon = icons[route.name as keyof TabParamList];

          return (
            <Button
              key={route.key}
              label={options?.title ?? 'Tab'}
              style={styles.tab}
              onLongPress={() => {
                navigation.emit({
                  target: route.key,
                  type: 'tabLongPress',
                });
              }}
              onPress={() => {
                const event = navigation.emit({
                  type: 'tabPress',
                  canPreventDefault: true,
                  target: route.key,
                });
                if (!(focused || event.defaultPrevented)) {
                  navigation.navigate(route.name, route.params);
                }
              }}
            >
              {icon && (
                <SymbolView
                  name={icon}
                  tintColor={
                    focused
                      ? theme.colors.violet.accent
                      : theme.colors.gray.accent
                  }
                />
              )}

              {options?.tabBarBadge && (
                <View style={styles.badge}>
                  <Typography contrast tabular fontWeight="bold" size="sm">
                    {options.tabBarBadge}
                  </Typography>
                </View>
              )}
            </Button>
          );
        })}
      </BlurView>
    </GestureDetector>
  );
}

const styles = StyleSheet.create((theme, rt) => ({
  badge: {
    backgroundColor: theme.colors.accent.accent,
    borderCurve: 'continuous',
    borderRadius: theme.radii.md,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.sm * 0.4,
    position: 'absolute',
    transform: [
      {
        translateX: theme.spacing.lg,
      },
      {
        translateY: theme.spacing.lg,
      },
    ],
  },
  main: {
    backgroundColor: theme.colors.gray.bgAlpha,
    borderTopColor: theme.colors.gray.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    zIndex: 100,
  },
  tab: {
    alignItems: 'center',
    flexGrow: 1,
    paddingBottom: theme.spacing.xl + rt.insets.bottom,
    paddingHorizontal: theme.spacing['3xl'],
    paddingTop: theme.spacing.lg,
  },
}));
