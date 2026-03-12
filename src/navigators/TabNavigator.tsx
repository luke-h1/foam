import {
  IconSymbol,
  type IconSymbolName,
} from '@app/components/IconSymbol/IconSymbol';
import { useAuthContext } from '@app/context/AuthContext';
import FollowingScreen from '@app/screens/FollowingScreen';
import { SearchScreen } from '@app/screens/SearchScreen/SearchScreen';
import {
  BottomTabScreenProps,
  createBottomTabNavigator,
} from '@react-navigation/bottom-tabs';
import {
  createNativeBottomTabNavigator,
  NativeBottomTabNavigationOptions,
} from '@react-navigation/bottom-tabs/unstable';
import { CompositeScreenProps } from '@react-navigation/native';
import { isLiquidGlassAvailable } from 'expo-glass-effect';
import { ComponentType, FC, useCallback, useMemo } from 'react';
import { Platform } from 'react-native';
import { useUnistyles } from 'react-native-unistyles';
import { AppStackParamList, AppStackScreenProps } from './AppNavigator';
import { SettingsStackNavigator } from './SettingsStackNavigator';
import { TopStackNavigator } from './TopStackNavigator';

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
const TabAndroid = createBottomTabNavigator<TabParamList>();

type TabBarIconProps = {
  focused: boolean;
  color: string | undefined;
  size: number;
  symbol: IconSymbolName;
  symbolFocused: IconSymbolName;
  colorFallback: string;
};

function TabBarIcon({
  focused,
  color,
  size,
  symbol,
  symbolFocused,
  colorFallback,
}: TabBarIconProps) {
  return (
    <IconSymbol
      name={focused ? symbolFocused : symbol}
      color={color ?? colorFallback}
      size={size}
    />
  );
}

type TabBarIconRenderProps = {
  focused: boolean;
  color: string | undefined;
  size: number;
};

function makeTabBarIcon(symbol: IconSymbolName, symbolFocused: IconSymbolName) {
  return function TabBarIconForScreen(props: TabBarIconRenderProps) {
    const { theme } = useUnistyles();
    return (
      <TabBarIcon
        {...props}
        symbol={symbol}
        symbolFocused={symbolFocused}
        colorFallback={theme.colors.gray.accent}
      />
    );
  };
}

const TAB_BAR_ICONS: Record<
  keyof TabParamList,
  ReturnType<typeof makeTabBarIcon>
> = {
  Following: makeTabBarIcon('person.2', 'person.2.fill'),
  Top: makeTabBarIcon('chart.bar', 'chart.bar.fill'),
  Search: makeTabBarIcon('magnifyingglass', 'magnifyingglass'),
  Settings: makeTabBarIcon('gearshape', 'gearshape.fill'),
};

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
  const { theme } = useUnistyles();
  const { user, authState } = useAuthContext();

  const availableScreens = useMemo(
    () => screens.filter(screen => !screen.requiresAuth || user),
    [user],
  );

  const initialRouteName = useMemo(() => {
    if (
      authState?.isLoggedIn &&
      user &&
      availableScreens.some(s => s.name === 'Following')
    ) {
      return 'Following';
    }
    return 'Top';
  }, [authState?.isLoggedIn, user, availableScreens]);

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
            android: {
              type: 'drawableResource' as const,
              name: screen.drawableResource,
            },
            default: {
              type: 'sfSymbol' as const,
              name: focused ? screen.sfSymbolFocused : screen.sfSymbol,
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

  if (Platform.OS === 'android') {
    return (
      <TabAndroid.Navigator
        initialRouteName={initialRouteName}
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: theme.colors.grass.accentAlpha,
          tabBarInactiveTintColor: theme.colors.gray.accent,
          tabBarStyle: {
            backgroundColor: theme.colors.gray.bg,
            borderTopColor: theme.colors.gray.border,
          },
        }}
      >
        {availableScreens.map(screen => (
          <TabAndroid.Screen
            key={screen.name}
            name={screen.name}
            component={screen.component as ComponentType}
            options={{
              tabBarIcon: TAB_BAR_ICONS[screen.name],
            }}
          />
        ))}
      </TabAndroid.Navigator>
    );
  }

  return (
    <Tab.Navigator
      initialRouteName={initialRouteName}
      screenOptions={{
        tabBarActiveTintColor: theme.colors.grass.accentAlpha,
        tabBarInactiveTintColor: theme.colors.gray.accent,
        tabBarStyle: {
          backgroundColor: theme.colors.gray.bg,
        },
        // @ts-expect-error: hapticFeedbackEnabled is not in types but supported by library
        hapticFeedbackEnabled: true,
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
