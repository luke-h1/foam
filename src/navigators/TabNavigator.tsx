import { HapticTab } from '@app/components/HapticTab';
import { IconSymbolName } from '@app/components/IconSymbol/IconSymbol';
import { ScreenSuspense } from '@app/components/ScreenSuspense';
import { useAuthContext } from '@app/context/AuthContext';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import {
  createNativeBottomTabNavigator,
  NativeBottomTabNavigationOptions,
} from '@react-navigation/bottom-tabs/unstable';
import { CompositeScreenProps } from '@react-navigation/native';
import { isLiquidGlassAvailable } from 'expo-glass-effect';
import { ComponentType, FC, lazy, useCallback, useMemo } from 'react';
import { Platform } from 'react-native';
import { useUnistyles } from 'react-native-unistyles';
import { AppStackParamList, AppStackScreenProps } from './AppNavigator';

const LazyFollowingScreen = lazy(() => import('@app/screens/FollowingScreen'));
const LazySearchScreen = lazy(() =>
  import('@app/screens/SearchScreen/SearchScreen').then(m => ({
    default: m.SearchScreen,
  })),
);
const LazySettingsStackNavigator = lazy(() =>
  import('./SettingsStackNavigator').then(m => ({
    default: m.SettingsStackNavigator,
  })),
);
const LazyTopStackNavigator = lazy(() =>
  import('./TopStackNavigator').then(m => ({
    default: m.TopStackNavigator,
  })),
);

function FollowingScreen() {
  return (
    <ScreenSuspense>
      <LazyFollowingScreen />
    </ScreenSuspense>
  );
}

function SearchScreen() {
  return (
    <ScreenSuspense>
      <LazySearchScreen />
    </ScreenSuspense>
  );
}

function SettingsStackNavigator() {
  return (
    <ScreenSuspense>
      <LazySettingsStackNavigator />
    </ScreenSuspense>
  );
}

function TopStackNavigator() {
  return (
    <ScreenSuspense>
      <LazyTopStackNavigator />
    </ScreenSuspense>
  );
}

export type TabParamList = {
  Following: undefined;
  Top: undefined;
  Search: undefined;
  Settings: undefined;
};

export type TabScreenProps<TParam extends keyof TabParamList> =
  CompositeScreenProps<
    BottomTabScreenProps<TabParamList, TParam>,
    AppStackScreenProps<keyof AppStackParamList>
  >;

const Tab = createNativeBottomTabNavigator<TabParamList>();

type ScreenComponentType =
  | FC<TabScreenProps<'Following'>>
  | FC<TabScreenProps<'Top'>>
  | FC<TabScreenProps<'Search'>>
  | FC<TabScreenProps<'Settings'>>;

interface Screen {
  name: keyof TabParamList;
  component: ScreenComponentType;
  sfSymbol: IconSymbolName;
  sfSymbolFocused: IconSymbolName;
  drawableResource: string;
  requiresAuth?: boolean;
  /** iOS only: use system tab bar item */
  tabBarSystemItem?: 'search';
}

const screens: Screen[] = [
  {
    name: 'Following',
    component: FollowingScreen,
    sfSymbol: 'person.2',
    sfSymbolFocused: 'person.2.fill',
    drawableResource: '',
    requiresAuth: true,
  },
  {
    name: 'Top',
    component: TopStackNavigator,
    sfSymbol: 'chart.bar',
    sfSymbolFocused: 'chart.bar.fill',
    drawableResource: '',
    requiresAuth: false,
  },
  {
    name: 'Search',
    component: SearchScreen,
    sfSymbol: 'magnifyingglass',
    sfSymbolFocused: 'magnifyingglass',
    drawableResource: '',
    requiresAuth: false,
    tabBarSystemItem: 'search',
  },
  {
    name: 'Settings',
    component: SettingsStackNavigator,
    sfSymbol: 'gearshape',
    sfSymbolFocused: 'gearshape.fill',
    drawableResource: '',
    requiresAuth: false,
  },
];

export function TabNavigator() {
  const { user } = useAuthContext();
  const { theme } = useUnistyles();

  // Get the screens that are currently rendered
  const availableScreens = useMemo(
    () => screens.filter(screen => !screen.requiresAuth || user),
    [user],
  );

  const getScreenOptions = useCallback(
    (screen: Screen): NativeBottomTabNavigationOptions => {
      const baseOptions: NativeBottomTabNavigationOptions = {
        lazy: true,
        headerShown: false,
        tabBarIcon: ({ focused }) =>
          Platform.select({
            ios: {
              type: 'sfSymbol' as const,
              name: focused ? screen.sfSymbolFocused : screen.sfSymbol,
            },
            default: {
              type: 'drawableResource' as const,
              name: screen.drawableResource,
            },
          }),
      };

      // iOS 26+: Use system search tab for native Liquid Glass tab bar styling
      // iOS 18 and earlier: Use SF Symbol for search icon
      // See: https://reactnavigation.org/docs/native-bottom-tab-navigator/
      if (
        screen.tabBarSystemItem === 'search' &&
        Platform.OS === 'ios' &&
        isLiquidGlassAvailable()
      ) {
        return {
          ...baseOptions,
          tabBarSystemItem: 'search',
          // Use undefined to let system handle icon for search tab
          tabBarIcon: undefined,
        };
      }

      return baseOptions;
    },
    [],
  );

  return (
    <Tab.Navigator
      initialRouteName="Top"
      screenOptions={{
        tabBarActiveTintColor: theme.colors.grass.accentAlpha,
        tabBarInactiveTintColor: theme.colors.gray.accent,
        // @ts-expect-error: hapticFeedbackEnabled is not in types but supported by library
        hapticFeedbackEnabled: true,
        tabBarButton: HapticTab,
      }}
    >
      {availableScreens.map(screen => (
        <Tab.Screen
          key={screen.name}
          name={screen.name}
          component={screen.component as ComponentType}
          options={() => ({
            ...getScreenOptions(screen),
          })}
        />
      ))}
    </Tab.Navigator>
  );
}
