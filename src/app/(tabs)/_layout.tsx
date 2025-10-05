/* eslint-disable react/no-unstable-nested-components */
import { IconSymbol } from '@app/components/IconSymbol/IconSymbol';
import { useAuthContext } from '@app/context';
import { Stack, Tabs } from 'expo-router';

export default function TabsLayout() {
  const { authState } = useAuthContext();

  const isAuthenticated = authState?.isLoggedIn && !authState?.isAnonAuth;

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <Tabs
        screenOptions={{
          headerShown: false,
          popToTopOnBlur: true,
        }}
        backBehavior="order"
      >
        <Tabs.Protected guard={isAuthenticated as boolean}>
          <Tabs.Screen
            name="following"
            options={{
              tabBarLabel: 'Following',
              href: '/(tabs)/following',
              tabBarIcon: ({ color, size }) => (
                <IconSymbol name="person.2" color={color} size={size} />
              ),
            }}
          />
        </Tabs.Protected>
        <Tabs.Screen
          name="top"
          options={{
            tabBarLabel: 'Top',
            href: '/(tabs)/top',
            tabBarIcon: ({ color, size }) => (
              <IconSymbol name="chart.bar" color={color} size={size} />
            ),
          }}
        />

        <Tabs.Screen
          name="search"
          options={{
            tabBarLabel: 'Search',
            href: '/(tabs)/search',
            tabBarIcon: ({ color, size }) => (
              <IconSymbol name="magnifyingglass" color={color} size={size} />
            ),
          }}
        />

        <Tabs.Screen
          name="settings"
          options={{
            tabBarLabel: 'Settings',
            href: '/(tabs)/settings',
            tabBarIcon: ({ color, size }) => (
              <IconSymbol name="gearshape" color={color} size={size} />
            ),
          }}
        />
      </Tabs>
    </>
  );
}
