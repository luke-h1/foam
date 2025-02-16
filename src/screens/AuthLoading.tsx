import { Spinner, Typography } from '@app/components';
import { useAuthContext } from '@app/context';
import { useAppNavigation } from '@app/hooks';
import { logInfo } from '@app/utils/logInfo';
import { useEffect } from 'react';
import { View } from 'react-native';

export function AuthLoadingScreen() {
  const { populateAuthState } = useAuthContext();
  const { navigate } = useAppNavigation();
  useEffect(() => {
    // todo - expose if we're anon or logged in an redirect to the following screen if we have an account
    populateAuthState().then(() => {
      logInfo('Navigating to tabs...');
      navigate('Tabs', {
        screen: 'Top',
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Typography>Auth loading...</Typography>
      <Spinner />
    </View>
  );
}
