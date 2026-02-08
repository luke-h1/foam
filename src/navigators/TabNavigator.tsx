import { TabBar } from '@app/components/TabBar/TabBar';
import { useAuthContext } from '@app/context/AuthContext';
import FollowingScreen from '@app/screens/FollowingScreen';
import { SearchScreen } from '@app/screens/SearchScreen/SearchScreen';
import {
  BottomTabScreenProps,
  createBottomTabNavigator,
} from '@react-navigation/bottom-tabs';
import { CompositeScreenProps } from '@react-navigation/native';
import { ComponentType, FC, useCallback, useMemo } from 'react';
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

const Tab = createBottomTabNavigator<TabParamList>();

type ScreenComponentType =
  | FC<TabScreenProps<'Following'>>
  | FC<TabScreenProps<'Top'>>
  | FC<TabScreenProps<'Search'>>
  | FC<TabScreenProps<'Settings'>>;

interface Screen {
  name: keyof TabParamList;
  component: ScreenComponentType;
  requiresAuth?: boolean;
}

const screens: Screen[] = [
  {
    name: 'Following',
    component: FollowingScreen,
    requiresAuth: true,
  },
  {
    name: 'Top',
    component: TopStackNavigator,
    requiresAuth: false,
  },
  {
    name: 'Search',
    component: SearchScreen,
    requiresAuth: false,
  },
  {
    name: 'Settings',
    component: SettingsStackNavigator,
    requiresAuth: false,
  },
];

export function TabNavigator() {
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

  const renderTabBar = useCallback(
    (props: import('@react-navigation/bottom-tabs').BottomTabBarProps) => (
      <TabBar {...props} />
    ),
    [],
  );

  return (
    <Tab.Navigator
      initialRouteName={initialRouteName}
      tabBar={renderTabBar}
      screenOptions={{
        lazy: true,
        headerShown: false,
      }}
    >
      {availableScreens.map(screen => (
        <Tab.Screen
          key={screen.name}
          name={screen.name}
          component={screen.component as ComponentType}
        />
      ))}
    </Tab.Navigator>
  );
}
