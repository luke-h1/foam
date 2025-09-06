import { TabBar } from '@app/components/TabBar';
import { useAuthContext } from '@app/context/AuthContext';
import { SearchScreen } from '@app/screens';
import FollowingScreen from '@app/screens/FollowingScreen';
import { createNativeBottomTabNavigator } from '@bottom-tabs/react-navigation';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps } from '@react-navigation/native';
import { SFSymbol } from 'expo-symbols';
import { ComponentType, FC } from 'react';
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
  symbol: SFSymbol;
  requiresAuth?: boolean;
}

const screens: Screen[] = [
  {
    name: 'Following',
    component: FollowingScreen,
    symbol: 'heart',
    requiresAuth: true,
  },
  {
    name: 'Top',
    component: TopStackNavigator,
    symbol: 'arrowshape.up',
    requiresAuth: false,
  },
  {
    name: 'Search',
    component: SearchScreen,
    symbol: 'sparkle.magnifyingglass',
    requiresAuth: false,
  },
  {
    name: 'Settings',
    component: SettingsStackNavigator,
    symbol: 'gear',
    requiresAuth: false,
  },
];

export function TabNavigator() {
  const { user } = useAuthContext();
  const { theme } = useUnistyles();

  return (
    <Tab.Navigator
      tabBarActiveTintColor={theme.colors.grass.accentAlpha}
      tabBarInactiveTintColor={theme.colors.gray.accent}
      hapticFeedbackEnabled
      // eslint-disable-next-line react/no-unstable-nested-components
      tabBar={props => <TabBar {...props} />}
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
              lazy: true,
              tabBarIcon: () => ({
                sfSymbol: screen.symbol,
                height: 10,
                width: 10,
              }),
            }}
          />
        );
      })}
    </Tab.Navigator>
  );
}
