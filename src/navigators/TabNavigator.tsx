import { IconSymbol } from '@app/components/IconSymbol/IconSymbol.ios';
import { IconSymbolName } from '@app/components/IconSymbol/IconSymbolFallback';
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

const Tab = createBottomTabNavigator<TabParamList>();

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

type ScreenComponentType =
  | FC<TabScreenProps<'Following'>>
  | FC<TabScreenProps<'Top'>>
  | FC<TabScreenProps<'Search'>>
  | FC<TabScreenProps<'Settings'>>;

interface Screen {
  name: keyof TabParamList;
  component: ScreenComponentType;
  icon: IconSymbolName;
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
    icon: 'arrow.up',
    requiresAuth: false,
  },
  {
    name: 'Search',
    component: SearchScreen,
    icon: 'text.magnifyingglass',
    requiresAuth: false,
  },
  {
    name: 'Settings',
    component: SettingsScreen,
    icon: 'gearshape',
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
          height: 80,
          marginTop: -20,
          paddingHorizontal: theme.spacing.lg,
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
                <IconSymbol name={screen.icon} color={color} size={size - 5} />
              ),
              tabBarLabel: screen.name,
            }}
          />
        );
      })}
    </Tab.Navigator>
  );
}
