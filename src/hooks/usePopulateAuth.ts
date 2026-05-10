import { useAuthContext } from '@app/context/AuthContext';
import { router } from 'expo-router';
import { useEffect, useRef } from 'react';

export function usePopulateAuth() {
  const { authState } = useAuthContext();
  const hasNavigated = useRef(false);

  useEffect(() => {
    // Only navigate if auth state changes after initial mount (e.g., user logs in)
    // The initial route is set correctly by the router index redirect
    if (hasNavigated.current || !authState) {
      return undefined;
    }

    // Only navigate if user logs in after app has started
    // This handles the case where user logs in from a different screen
    if (authState.isLoggedIn) {
      hasNavigated.current = true;
      // Use a small delay to ensure the router tree has mounted
      const timer = setTimeout(() => {
        router.replace('/tabs/following');
      }, 0);

      return () => clearTimeout(timer);
    }

    return undefined;
  }, [authState]);
}
