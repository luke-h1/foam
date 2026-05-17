import { Icon } from '@app/components/Icon/Icon';
import { AnimatedTabBar } from '@app/components/MotionTabs/animated-tab-bar';
import { useAuthContext } from '@app/context/AuthContext';
import { theme } from '@app/styles/themes';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Tabs } from 'expo-router';
import type { ComponentProps } from 'react';
import { Platform, StyleSheet } from 'react-native';

type TabBarIconProps = {
  color: string;
  size: number;
};

const renderTabIcon =
  (icon: string, iconFamily?: ComponentProps<typeof Icon>['iconFamily']) =>
  ({ color, size }: TabBarIconProps) => (
    <Icon icon={icon} iconFamily={iconFamily} color={color} size={size} />
  );

export default function TabsLayout() {
  const { authState, ready } = useAuthContext();
  const showFollowingTab = !ready || Boolean(authState?.isLoggedIn);

  return (
    <Tabs
      detachInactiveScreens={Platform.OS !== 'ios'}
      screenOptions={{
        animation: 'shift',
        freezeOnBlur: true,
        headerShown: false,
        tabBarActiveTintColor: theme.colorDarkGreen,
        tabBarInactiveTintColor: theme.colorGreyAlpha,
        tabBarStyle: styles.tabBar,
      }}
      tabBar={(props: BottomTabBarProps) => <AnimatedTabBar {...props} />}
    >
      <Tabs.Protected guard={showFollowingTab}>
        <Tabs.Screen
          name="following"
          options={{
            title: 'Following',
            tabBarIcon: renderTabIcon('users'),
          }}
        />
      </Tabs.Protected>
      <Tabs.Screen
        name="top"
        options={{
          title: 'Top',
          tabBarIcon: renderTabIcon('bar-chart-2'),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          tabBarIcon: renderTabIcon('search'),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: renderTabIcon('settings'),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: 'transparent',
    borderTopWidth: 0,
    elevation: 0,
    height: 104,
    position: 'absolute',
  },
});
