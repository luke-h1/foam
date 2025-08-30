import { useAuthContext } from '@app/context';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';

export function usePopulateAuth() {
  const { populateAuthState, authState, ready } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    void populateAuthState();
  }, [populateAuthState]);

  useEffect(() => {
    // Only navigate once auth is ready AND we have a valid auth state
    if (!ready || !authState) return;

    console.log('🔥 Auth is ready, navigating...', { ready, authState });

    /**
     * Logged in - navigate user to following tab
     */
    if (authState.isLoggedIn) {
      router.push('/(tabs)/following');
      return;
    }

    /**
     * We've acquired a token, and the user is not logged in
     * Navigate them to the Top stack since `Following` won't
     * be available
     */
    if (authState.isAnonAuth && authState.token?.accessToken) {
      router.push('/(tabs)/top');
    }
  }, [ready, authState, router]);
}
