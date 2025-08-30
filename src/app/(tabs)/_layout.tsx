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
        {/* Following tab - only for authenticated users */}
        <Tabs.Protected guard={isAuthenticated as boolean}>
          <Tabs.Screen
            name="following"
            options={{
              tabBarLabel: 'Following',
              href: '/(tabs)/following',
            }}
          />
        </Tabs.Protected>
        <Tabs.Screen
          name="top"
          options={{
            tabBarLabel: 'Top',
            href: '/(tabs)/top/top-streams',
          }}
        />

        <Tabs.Screen
          name="search"
          options={{
            tabBarLabel: 'Search',
            href: '/(tabs)/search',
          }}
        />

        <Tabs.Screen
          name="settings"
          options={{
            tabBarLabel: 'Settings',
            href: '/(tabs)/settings',
          }}
        />
      </Tabs>
    </>
  );
}
