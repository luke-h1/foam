/* eslint-disable @typescript-eslint/no-misused-promises */
import { Button, Typography } from '@app/components';
import { useAuthContext } from '@app/context/AuthContext';
import { useAppNavigation } from '@app/hooks';
import { useAuthRequest } from 'expo-auth-session';
import newRelic from 'newrelic-react-native-agent';
import { useEffect } from 'react';
import { Platform, View, ViewStyle } from 'react-native';
import { toast } from 'sonner-native';

const USER_SCOPES = [
  'user:read:follows',
  'user:read:blocked_users',
  'user:read:emotes',
  'user:manage:blocked_users',
] as const;

const CHAT_SCOPES = ['chat:read', 'chat:edit'] as const;

const WHISPER_SCOPES = ['whispers:read', 'whispers:edit'] as const;

const CHANNEL_SCOPES = [
  'channel:read:polls',
  'channel:read:predictions',
  'channel:moderate',
] as const;

const proxyUrl = new URL(
  Platform.select({
    native: `${process.env.AUTH_PROXY_API_BASE_URL}/proxy`,
    default: `${process.env.AUTH_PROXY_API_BASE_URL}/pending`,
    web: `${process.env.AUTH_PROXY_API_BASE_URL}/pending`,
    ios: `${process.env.AUTH_PROXY_API_BASE_URL}/proxy`,
  }),
).toString();

export function LoginScreen() {
  const navigation = useAppNavigation();

  const { loginWithTwitch } = useAuthContext();

  const discovery = {
    authorizationEndpoint: 'https://id.twitch.tv/oauth2/authorize',
    tokenEndpoint: 'https://id.twitch.tv/oauth2/token',
    revocationEndpoint: 'https://id.twitch.tv/oauth2/revoke',
  } as const;

  const [request, response, promptAsync] = useAuthRequest(
    {
      clientId: process.env.TWITCH_CLIENT_ID as string,
      clientSecret: process.env.TWITCH_CLIENT_SECRET as string,
      scopes: [
        ...USER_SCOPES,
        ...CHAT_SCOPES,
        ...WHISPER_SCOPES,
        ...CHANNEL_SCOPES,
      ],
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

      navigation.popTo('Tabs', {
        screen: 'Following',
      });
    }

    newRelic.recordCustomEvent(
      'Login',
      response?.type ?? 'LoginFail',
      new Map(),
    );
  };

  useEffect(() => {
    if (response && response?.type === 'success') {
      void handleAuth();
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [response]);

  return (
    <View
      style={{
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
    </View>
  );
}

const $buttonWrapper: ViewStyle = {};

const $textWrapper: ViewStyle = {
  marginTop: 16,
};
