import { useAuthContext } from '@app/context';
import { useAppNavigation } from '@app/hooks';
import { useEffect } from 'react';

export function AuthLoadingScreen() {
  const { populateAuthState, authState } = useAuthContext();
  const { navigate } = useAppNavigation();
  useEffect(() => {
    populateAuthState().then(() => {
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

  return null;
}
