import { HapticTab } from '@app/components/HapticTab';
import { IconSymbolName } from '@app/components/IconSymbol/IconSymbol';
import { useAuthContext } from '@app/context/AuthContext';
import FollowingScreen from '@app/screens/FollowingScreen';
import { SearchScreen } from '@app/screens/SearchScreen/SearchScreen';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import {
  createNativeBottomTabNavigator,
  NativeBottomTabNavigationOptions,
} from '@react-navigation/bottom-tabs/unstable';
import { CompositeScreenProps } from '@react-navigation/native';
import { ComponentType, FC, useCallback } from 'react';
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

      // iOS: Use system search tab for native tab bar styling
      // See: https://reactnavigation.org/docs/native-bottom-tab-navigator/
      if (screen.tabBarSystemItem === 'search' && Platform.OS === 'ios') {
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
      {screens.map(screen => {
        if (screen.requiresAuth && !user) {
          return null;
        }

        return (
          <Tab.Screen
            key={screen.name}
            name={screen.name}
            component={screen.component as ComponentType}
            options={getScreenOptions(screen)}
          />
        );
      })}
    </Tab.Navigator>
  );
}
