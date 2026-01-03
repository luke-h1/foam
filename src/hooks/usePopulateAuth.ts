import { useAuthContext } from '@app/context/AuthContext';
import { navigate } from '@app/navigators/navigationUtilities';
import { useEffect, useRef } from 'react';

export function usePopulateAuth() {
  const { authState } = useAuthContext();
  const hasNavigated = useRef(false);

  useEffect(() => {
    // Only navigate if auth state changes after initial mount (e.g., user logs in)
    // The initial route is set correctly in TabNavigator based on auth state
    if (hasNavigated.current || !authState) {
      return undefined;
    }

    // Only navigate if user logs in after app has started
    // This handles the case where user logs in from a different screen
    if (authState.isLoggedIn) {
      hasNavigated.current = true;
      // Use a small delay to ensure TabNavigator has mounted
      const timer = setTimeout(() => {
        navigate('Tabs', {
          screen: 'Following',
        });
      }, 0);
      return () => clearTimeout(timer);
    }

    return undefined;
  }, [authState]);
}
