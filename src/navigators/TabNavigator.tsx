import { Icon } from '@app/components';
import { useAuthContext } from '@app/context/AuthContext';
import { SearchScreen, SettingsScreen } from '@app/screens';
import FollowingScreen from '@app/screens/FollowingScreen';
import {
  BottomTabScreenProps,
  createBottomTabNavigator,
} from '@react-navigation/bottom-tabs';
import { CompositeScreenProps } from '@react-navigation/native';
import React, { ComponentType, FC } from 'react';
import { useStyles } from 'react-native-unistyles';
import { AppStackParamList, AppStackScreenProps } from './AppNavigator';
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
  icon: string;
  requiresAuth?: boolean;
}

const screens: Screen[] = [
  {
    name: 'Following',
    component: FollowingScreen,
    icon: 'heart',
    requiresAuth: true,
  },
  {
    name: 'Top',
    component: TopStackNavigator,
    icon: 'chevron-up',
    requiresAuth: false,
  },
  {
    name: 'Search',
    component: SearchScreen,
    icon: 'search',
    requiresAuth: false,
  },
  {
    name: 'Settings',
    component: SettingsScreen,
    icon: 'settings',
    requiresAuth: false,
  },
];

export function TabNavigator() {
  const { user } = useAuthContext();
  const { theme } = useStyles();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          height: 90,
          marginTop: -20,
          paddingHorizontal: theme.spacing.xs,
        },
        tabBarItemStyle: {
          justifyContent: 'center',
          paddingVertical: theme.spacing.xs,
          paddingHorizontal: theme.spacing.xs,
        },
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: theme.colors.brightPurple,
        tabBarLabelPosition: 'below-icon',
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
            options={{
              // eslint-disable-next-line react/no-unstable-nested-components
              tabBarIcon: ({ color, size }) => (
                <Icon icon={screen.icon} color={color} size={size - 7} />
              ),
              tabBarLabel: screen.name,
            }}
          />
        );
      })}
    </Tab.Navigator>
  );
}
