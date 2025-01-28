import { Spinner } from '@app/components';
import { useAuthContext } from '@app/context/AuthContext';
import { useAppNavigation } from '@app/hooks';
import { useEffect } from 'react';

export function AuthLoadingScreen() {
  const { navigate } = useAppNavigation();

  const { populateAuthState } = useAuthContext();

  useEffect(() => {
    // todo - expose if we're anon or logged in an redirect to the following screen if we have an account
    populateAuthState().then(() => {
      navigate('Tabs', {
        screen: 'Top',
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <Spinner />;
}
