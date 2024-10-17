import Button from '@app/components/Button';
import { useAuthContext } from '@app/context/AuthContext';
import {
  HomeTabsParamList,
  HomeTabsRoutes,
} from '@app/navigation/Home/HomeTabs';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { useAuthRequest } from 'expo-auth-session';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as WebBrowser from 'expo-web-browser';
import { useEffect } from 'react';
import { View, Alert, Platform, KeyboardAvoidingView } from 'react-native';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const { login } = useAuthContext();

  const { navigate } = useNavigation<NavigationProp<HomeTabsParamList>>();

  const isExpoGo =
    Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

  const serverOrigin =
    process.env.NODE_ENV === 'development'
      ? 'http://localhost:8082/'
      : // TODO: Set this as your production dev server location. You can also configure this using an environment variable for preview deployments.
        'https://.../';

  const proxyUrl = new URL(
    // This changes because we have a naive proxy that hardcodes the redirect URL.
    Platform.select({
      native: isExpoGo
        ? `${process.env.EXPO_PUBLIC_PROXY_API_BASE_URL}/proxy-expo-go`
        : `${process.env.EXPO_PUBLIC_PROXY_API_BASE_URL}/proxy`,
      // This can basically be any web URL.
      default: `${process.env.EXPO_PUBLIC_PROXY_API_BASE_URL}/auth/pending`,
    }),
    serverOrigin,
  ).toString();

  const discovery = {
    authorizationEndpoint: 'https://id.twitch.tv/oauth2/authorize',
    tokenEndpoint: 'https://id.twitch.tv/oauth2/token',
    revocationEndpoint: 'https://id.twitch.tv/oauth2/revoke',
  } as const;

  const [request, response, promptAsync] = useAuthRequest(
    {
      clientId: process.env.EXPO_PUBLIC_TWITCH_CLIENT_ID,
      // clientSecret: process.env.EXPO_PUBLIC_TWITCH_CLIENT_SECRET,
      scopes: [
        'chat:read chat:edit user:read:follows user:read:blocked_users user:manage:blocked_users channel:read:polls channel:read:predictions',
      ],
      redirectUri: proxyUrl,
      responseType: 'token',
      extraParams: {
        // @ts-expect-error - Twitch requires force_verify to be a boolean but
        // the react-native types are Record<string, string>
        force_verify: true,
      },
    },
    discovery,
  );

  const handleAuth = async () => {
    await login(response);
    if (response?.type === 'success') {
      navigate(HomeTabsRoutes.Top);
    }
    Alert.alert('Authentication', 'login successful');
    // TODO: alert user
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
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <KeyboardAvoidingView>
        <Button
          title="login"
          disabled={!request}
          onPress={() => promptAsync()}
        />
      </KeyboardAvoidingView>
    </View>
  );
}
