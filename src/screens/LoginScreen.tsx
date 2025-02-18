import { Button, Screen, Typography } from '@app/components';
import { useAuthContext } from '@app/context/AuthContext';
import { useAppNavigation, useHeader } from '@app/hooks';
import { useAuthRequest } from 'expo-auth-session';
import { useEffect } from 'react';
import { Alert, Platform, View, ViewStyle } from 'react-native';

const SCOPES = [
  'chat:read chat:edit user:read:follows user:read:blocked_users user:manage:blocked_users channel:read:polls channel:read:predictions',
];

// const serverOrigin =
//   process.env.NODE_ENV === 'development'
//     ? 'http://localhost:8081/'
//     : // TODO: Set this as your production dev server location. You can also configure this using an environment variable for preview deployments.
//       'foam://';

const proxyUrl = new URL(
  // This changes because we have a naive proxy that hardcodes the redirect URL.
  Platform.select({
    native: `${process.env.EXPO_PUBLIC_PROXY_API_BASE_URL}/proxy`,
    // This can basically be any web URL.
    default: `${process.env.EXPO_PUBLIC_PROXY_API_BASE_URL}/pending`,
    ios: `${process.env.EXPO_PUBLIC_PROXY_API_BASE_URL}/proxy`,
  }),
).toString();

export function LoginScreen() {
  const { navigate, goBack } = useAppNavigation();
  useHeader({
    title: 'Login',
    leftIcon: 'arrow-left',
    onLeftPress: () => goBack(),
  });

  const { loginWithTwitch } = useAuthContext();

  const discovery = {
    authorizationEndpoint: 'https://id.twitch.tv/oauth2/authorize',
    tokenEndpoint: 'https://id.twitch.tv/oauth2/token',
    revocationEndpoint: 'https://id.twitch.tv/oauth2/revoke',
  } as const;

  const [request, response, promptAsync] = useAuthRequest(
    {
      clientId: process.env.EXPO_PUBLIC_TWITCH_CLIENT_ID,
      clientSecret: process.env.EXPO_PUBLIC_TWITCH_CLIENT_SECRET,
      scopes: SCOPES,

      // Use implicit flow to avoid code exchange.
      responseType: 'token',
      redirectUri: proxyUrl,

      // Enable PKCE (Proof Key for Code Exchange) to prevent another app from intercepting the redirect request.
      usePKCE: true,
      extraParams: {
        force_verify: 'true',
      },
    },
    discovery,
  );

  console.log('request', request);
  console.log('response', response);

  const handleAuth = async () => {
    await loginWithTwitch(response);
    if (response?.type === 'success') {
      navigate('Tabs', {
        screen: 'Following',
      });
    }
    Alert.alert('Authentication', 'login successful');
  };

  useEffect(() => {
    if (response && response?.type === 'success') {
      handleAuth();
    }
    // eslint-disable-next-line no-console
    console.info('response', response);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [response]);

  return (
    <Screen
      contentContainerStyle={{
        padding: 8,
        display: 'flex',
        alignItems: 'center',
      }}
    >
      <View style={$buttonWrapper} />
      <View style={$textWrapper}>
        <Button onPress={() => promptAsync()} disabled={!request}>
          <Typography>Login with Twitch</Typography>
        </Button>
      </View>
    </Screen>
  );
}

const $buttonWrapper: ViewStyle = {};

const $textWrapper: ViewStyle = {
  marginTop: 16,
};
