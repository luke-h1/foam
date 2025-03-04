import { Spinner, Typography } from '@app/components';
import { useAuthContext } from '@app/context';
import { useAppNavigation } from '@app/hooks';
import { useEffect } from 'react';
import { View } from 'react-native';

export function AuthLoadingScreen() {
  const { populateAuthState, authState } = useAuthContext();
  const { navigate } = useAppNavigation();
  useEffect(() => {
    // todo - expose if we're anon or logged in an redirect to the following screen if we have an account
    populateAuthState().then(() => {
      if (authState?.isLoggedIn) {
        console.log('isAuth true');
        navigate('Tabs', {
          screen: 'Following',
        });
      }

      if (authState?.isAnonAuth) {
        console.log('isAnonAuth true');
        navigate('Tabs', {
          screen: 'Top',
        });
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={{ flex: 1, padding: 16, justifyContent: 'center' }}>
      <Typography>Auth loading...</Typography>
      <Spinner />
    </View>
  );
}
