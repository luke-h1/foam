import { Button, Screen, Typography } from '@app/components';
import { useAuthContext } from '@app/context/AuthContext';
import { useAppNavigation, useHeader } from '@app/hooks';
import { useAuthRequest } from 'expo-auth-session';
import newRelic from 'newrelic-react-native-agent';
import { useEffect } from 'react';
import { Platform, View, ViewStyle } from 'react-native';
import { toast } from 'sonner-native';

const SCOPES = [
  'chat:read chat:edit user:read:follows user:read:blocked_users user:manage:blocked_users channel:read:polls channel:read:predictions',
];

const proxyUrl = new URL(
  // This changes because we have a naive proxy that hardcodes the redirect URL.
  Platform.select({
    native: `${process.env.AUTH_PROXY_API_BASE_URL}/proxy`,
    // This can basically be any web URL.
    default: `${process.env.AUTH_PROXY_API_BASE_URL}/pending`,
    ios: `${process.env.AUTH_PROXY_API_BASE_URL}/proxy`,
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
      clientId: process.env.TWITCH_CLIENT_ID,
      clientSecret: process.env.TWITCH_CLIENT_SECRET,
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

  const handleAuth = async () => {
    await loginWithTwitch(response);
    if (response?.type === 'success') {
      newRelic.recordCustomEvent('Login', 'LoginSuccess', new Map());
      toast.success('Logged in');
      navigate('Tabs', {
        screen: 'Following',
      });
    }
  };

  useEffect(() => {
    if (response && response?.type === 'success') {
      void handleAuth();
    }
    // eslint-disable-next-line no-console
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
        <Button onPress={() => void promptAsync()} disabled={!request}>
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
