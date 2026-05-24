import { AnimatedTabBar } from '@app/components/MotionTabs/animated-tab-bar';
import { useAuthContext } from '@app/context/AuthContext';
import { theme } from '@app/styles/themes';
import { Tabs } from 'expo-router';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { Platform, StyleSheet, type ColorValue } from 'react-native';

type TabBarIconProps = {
  color: ColorValue;
  size: number;
};

const renderTabIcon =
  (name: SymbolViewProps['name']) =>
  ({ color, size }: TabBarIconProps) => (
    <SymbolView name={name} tintColor={String(color)} size={size} />
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
      tabBar={props => <AnimatedTabBar {...props} />}
    >
      <Tabs.Protected guard={showFollowingTab}>
        <Tabs.Screen
          name="following"
          options={{
            title: 'Following',
            tabBarIcon: renderTabIcon('person.2'),
          }}
        />
      </Tabs.Protected>
      <Tabs.Screen
        name="top"
        options={{
          title: 'Top',
          tabBarIcon: renderTabIcon('chart.bar.xaxis'),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          tabBarIcon: renderTabIcon('magnifyingglass'),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: renderTabIcon('gearshape'),
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
