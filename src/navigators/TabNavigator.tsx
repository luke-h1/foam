import { TabBarButton } from '@app/components';
import { useAuthContext } from '@app/context/AuthContext';
import { SearchScreen, SettingsScreen } from '@app/screens';
import FollowingScreen from '@app/screens/FollowingScreen';
import {
  BottomTabScreenProps,
  createBottomTabNavigator,
} from '@react-navigation/bottom-tabs';
import { CompositeScreenProps } from '@react-navigation/native';
import { ComponentType, FC } from 'react';
import { Platform } from 'react-native';
import { useUnistyles } from 'react-native-unistyles';
import Feather from 'react-native-vector-icons/Feather';
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
  const { theme } = useUnistyles();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: theme.colors.screen,
          borderTopWidth: 1,
          borderTopColor: theme.colors.borderFaint,
          // height: Platform.OS === 'ios' ? 85 : 70,
          paddingBottom: Platform.OS === 'ios' ? 25 : 10,
          paddingTop: 10,
          paddingHorizontal: theme.spacing.md,
          elevation: 0, // Remove shadow on Android
          shadowOpacity: 0, // Remove shadow on iOS
        },
        tabBarHideOnKeyboard: true,
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
              headerStyle: {
                backgroundColor: theme.colors.tabBarBackground,
              },
              // eslint-disable-next-line react/no-unstable-nested-components
              tabBarButton: props => (
                <TabBarButton
                  {...props}
                  activeTintColor={theme.colors.brightPurple}
                  inactiveTintColor={theme.colors.tabBarInactiveTintColor}
                  {...props}
                  // eslint-disable-next-line react/no-unstable-nested-components
                  icon={({ color }) => (
                    <Feather name={screen.icon} size={24} color={color} />
                  )}
                />
              ),

              tabBarLabel: screen.name,
            }}
          />
        );
      })}
    </Tab.Navigator>
  );
}
