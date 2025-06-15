import { useAuthContext } from '@app/context';
import { useEffect } from 'react';
import { useAppNavigation } from './useAppNavigation';

export function useAcquireAuth() {
  const { populateAuthState, authState } = useAuthContext();
  const { navigate } = useAppNavigation();
  useEffect(() => {
    void populateAuthState().then(() => {
      if (authState?.isLoggedIn) {
        navigate('Tabs', {
          screen: 'Following',
        });
      }

      if (authState?.isAnonAuth) {
        navigate('Tabs', {
          screen: 'Top',
        });
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
