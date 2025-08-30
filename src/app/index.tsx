import { useAuthContext } from '@app/context';
import { Redirect, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';

/**
 * Dummy initial route that redirects to the actual main route
 * @see https://github.com/expo/router/issues/428#issuecomment-1540011427
 */
export default function Layout() {
  const router = useRouter();
  const { authState, ready } = useAuthContext();

  useEffect(() => {
    if (!ready) return;

    if (authState?.isAnonAuth) {
      router.push('/(tabs)/top/top-streams');
    } else {
      router.push('/(tabs)/following');
    }
  }, [ready, authState?.isAnonAuth, authState?.isLoggedIn, router]);

  // Show loading spinner while auth context is initializing
  if (!ready) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return <Redirect href="/(tabs)/top/top-streams" />;
}
