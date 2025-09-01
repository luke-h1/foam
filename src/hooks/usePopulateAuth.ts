import { useAuthContext } from '@app/context';
import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';

export function usePopulateAuth() {
  const { populateAuthState, authState, ready } = useAuthContext();
  const router = useRouter();
  const hasNavigated = useRef(false);

  useEffect(() => {
    void populateAuthState();
  }, []); // Empty dependency array - only run once

  useEffect(() => {
    // Only navigate once auth is ready AND we have a valid auth state AND we haven't navigated yet
    if (!ready || !authState || hasNavigated.current) return;

    console.log('🔥 Auth is ready, navigating...', { ready, authState });

    /**
     * Logged in - navigate user to following tab
     */
    if (authState.isLoggedIn) {
      hasNavigated.current = true;
      router.push('/(tabs)/following');
      return;
    }

    /**
     * We've acquired a token, and the user is not logged in
     * Navigate them to the Top stack since `Following` won't
     * be available
     */
    if (authState.isAnonAuth && authState.token?.accessToken) {
      hasNavigated.current = true;
      router.push('/(tabs)/top');
    }
  }, [ready, authState, router]);
}
