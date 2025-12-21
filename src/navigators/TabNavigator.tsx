import { HapticTab } from '@app/components/HapticTab';
import {
  IconSymbol,
  IconSymbolName,
} from '@app/components/IconSymbol/IconSymbol';
import { useAuthContext } from '@app/context/AuthContext';
import { SearchScreen } from '@app/screens/SearchScreen/SearchScreen';
import FollowingScreen from '@app/screens/FollowingScreen';
import {
  BottomTabScreenProps,
  createBottomTabNavigator,
} from '@react-navigation/bottom-tabs';
import { CompositeScreenProps } from '@react-navigation/native';
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

const Tab = createBottomTabNavigator<TabParamList>();

type ScreenComponentType =
  | FC<TabScreenProps<'Following'>>
  | FC<TabScreenProps<'Top'>>
  | FC<TabScreenProps<'Search'>>
  | FC<TabScreenProps<'Settings'>>;

interface Screen {
  name: keyof TabParamList;
  component: ScreenComponentType;
  symbol: IconSymbolName;
  requiresAuth?: boolean;
}

const screens: Screen[] = [
  {
    name: 'Following',
    component: FollowingScreen,
    symbol: 'person.2',
    requiresAuth: true,
  },
  {
    name: 'Top',
    component: TopStackNavigator,
    symbol: 'chart.bar',
    requiresAuth: false,
  },
  {
    name: 'Search',
    component: SearchScreen,
    symbol: 'magnifyingglass',
    requiresAuth: false,
  },
  {
    name: 'Settings',
    component: SettingsStackNavigator,
    symbol: 'gearshape',
    requiresAuth: false,
  },
];

export function TabNavigator() {
  const { user } = useAuthContext();
  const { theme } = useUnistyles();

  return (
    <Tab.Navigator
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
            options={{
              lazy: true,
              headerShown: false,
              // eslint-disable-next-line react/no-unstable-nested-components
              tabBarIcon: ({ focused, color, size }) => (
                <IconSymbol
                  name={screen.symbol}
                  color={color}
                  size={size}
                  weight={focused ? 'semibold' : 'regular'}
                />
              ),
            }}
          />
        );
      })}
    </Tab.Navigator>
  );
}
