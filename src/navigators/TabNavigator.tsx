import Icon from '@app/components/ui/Icon';
import { useAuthContext } from '@app/context/AuthContext';
import FollowingScreen from '@app/screens/FollowingScreen';
import SearchScreen from '@app/screens/SearchScreen';
import SettingsScreen from '@app/screens/SettingsScreen';
import { colors, layout, spacing, typography } from '@app/styles';
import {
  BottomTabScreenProps,
  createBottomTabNavigator,
} from '@react-navigation/bottom-tabs';
import { CompositeScreenProps } from '@react-navigation/native';
import React, { ComponentType, FC } from 'react';
import { TextStyle, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppStackParamList, AppStackScreenProps } from './AppNavigator';
import TopStackNavigator from './TopStackNavigator';

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

export default function TabNavigator() {
  const { bottom } = useSafeAreaInsets();
  const { user } = useAuthContext();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarStyle: [$tabBar, { height: bottom + layout.tabBarHeight }],
        tabBarActiveTintColor: colors.text,
        tabBarInactiveTintColor: colors.text,
        tabBarLabelStyle: $tabBarLabel,
        tabBarItemStyle: $tabBarItem,
        tabBarAllowFontScaling: false,
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
              tabBarIcon: ({ focused }) => (
                <Icon
                  icon={screen.icon}
                  color={focused ? colors.tint : colors.palette.primary100}
                />
              ),
            }}
          />
        );
      })}
    </Tab.Navigator>
  );
}

const $tabBar: ViewStyle = {
  backgroundColor: colors.background,
  borderTopColor: colors.transparent,
};

const $tabBarItem: ViewStyle = {
  paddingTop: spacing.medium,
};

const $tabBarLabel: TextStyle = {
  fontSize: 12,
  fontFamily: typography.primary.medium,
  lineHeight: 16,
  flex: 1,
};
