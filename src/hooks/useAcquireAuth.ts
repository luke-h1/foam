import { useAuthContext } from '@app/context';
import { useEffect, useState } from 'react';
import { useAppNavigation } from './useAppNavigation';

export function useAcquireAuth() {
  const [loading, setLoading] = useState<boolean>(true);
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
      setLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    loading,
  };
}
