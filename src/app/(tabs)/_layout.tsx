import { useAuthContext } from '@app/context';
import { Stack, Tabs } from 'expo-router';

export default function TabsLayout() {
  const { authState, ready } = useAuthContext();

  // Don't render tabs until auth state is ready
  if (!ready) {
    return null;
  }

  // Determine which tabs to show based on auth state
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
        {isAuthenticated && (
          <Tabs.Screen
            name="following"
            options={{
              tabBarLabel: 'Following',
              href: '/(tabs)/following',
            }}
          />
        )}
        
        {/* Top tab - available for all users */}
        <Tabs.Screen
          name="top"
          options={{
            tabBarLabel: 'Top',
            href: '/(tabs)/top',
          }}
        />
        
        {/* Search tab - available for all users */}
        <Tabs.Screen
          name="search"
          options={{
            tabBarLabel: 'Search',
            href: '/(tabs)/search',
          }}
        />
        
        {/* Settings tab - available for all users */}
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
