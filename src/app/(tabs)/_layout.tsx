import { Stack, Tabs } from 'expo-router';

export default function TabsLayout() {
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
        <Tabs.Screen
          name="following"
          options={{
            tabBarLabel: 'Following',
            href: '/(tabs)/following',
          }}
        />
        <Tabs.Screen
          name="top"
          options={{
            tabBarLabel: 'Top',
            href: '/(tabs)/top',
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
