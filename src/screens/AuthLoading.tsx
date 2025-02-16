import { Spinner, Typography } from '@app/components';
import { View } from 'react-native';

export function AuthLoadingScreen() {
  // useEffect(() => {
  //   // todo - expose if we're anon or logged in an redirect to the following screen if we have an account
  //   populateAuthState().then(() => {
  //     navigate('Tabs', {
  //       screen: 'Top',
  //     });
  //   });
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, []);

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Typography>Auth loading...</Typography>

      <Typography>
        PROXY URL: {process.env.EXPO_PUBLIC_PROXY_API_BASE_URL}
      </Typography>
      <Typography>
        TWITCH_CLIENT_ID: {process.env.EXPO_PUBLIC_TWITCH_CLIENT_ID}
      </Typography>
      <Typography>
        TWITCH_CLIENT_SECRET: {process.env.EXPO_PUBLIC_TWITCH_CLIENT_SECRET}
      </Typography>

      <Spinner />
    </View>
  );
}
