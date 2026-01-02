import { useAuthContext } from '@app/context/AuthContext';
import { navigate } from '@app/navigators/navigationUtilities';
import { useEffect, useRef } from 'react';

export function usePopulateAuth() {
  const { authState } = useAuthContext();
  const hasNavigated = useRef(false);

  useEffect(() => {
    // Only navigate once when auth state is ready
    if (hasNavigated.current || !authState) {
      return;
    }

    /**
     * Logged in - navigate user to following tab
     */
    if (authState.isLoggedIn) {
      hasNavigated.current = true;
      navigate('Tabs', {
        screen: 'Following',
      });
      return;
    }

    /**
     * We've acquired a token, and the user is not logged in
     * Navigate them to the Top stack since `Following` won't
     * be available
     */
    if (authState.isAnonAuth) {
      hasNavigated.current = true;
      navigate('Tabs', {
        screen: 'Top',
      });
    }
  }, [authState]);
}
