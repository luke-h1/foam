import { useAuthContext } from '@app/context/AuthContext';
import { useEffect } from 'react';
import { useAppNavigation } from './useAppNavigation';

export function usePopulateAuth() {
  const { populateAuthState, authState } = useAuthContext();
  const { navigate } = useAppNavigation();

  useEffect(() => {
    void populateAuthState().then(() => {
      // Skip navigation if Storybook is enabled
      if (process.env.EXPO_PUBLIC_STORYBOOK === 'true') {
        return;
      }

      /**
       * Logged in - navigate user to following tab
       */
      if (authState?.isLoggedIn) {
        navigate('Tabs', {
          screen: 'Following',
        });
      }

      /**
       * We've acquired a token, and the user is not logged in
       * Navigate them to the Top stack since `Following` won't
       * be available
       */
      if (authState?.isAnonAuth) {
        navigate('Tabs', {
          screen: 'Top',
        });
      }
    });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
