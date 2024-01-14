/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-console */
import { useAuthContext } from '@app/context/AuthContext';
import {
  HomeTabsParamList,
  HomeTabsRoutes,
} from '@app/navigation/Home/HomeTabs';
import logger from '@app/utils/logger';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { makeRedirectUri, useAuthRequest } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { useEffect } from 'react';
import { View, Button } from 'react-native';

WebBrowser.maybeCompleteAuthSession();

const LoginScreen = () => {
  const { login } = useAuthContext();

  const { navigate } = useNavigation<NavigationProp<HomeTabsParamList>>();

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
      redirectUri: makeRedirectUri(),
      responseType: 'token',
      extraParams: {
        // @ts-expect-error - Twitch requires force_verify to be a boolean whereas
        // the types are Record<string, string>
        force_verify: true,
      },
    },
    discovery,
  );

  const handleAuth = async () => {
    await login(response);
    if (response?.type === 'success') {
      navigate(HomeTabsRoutes.Top);
    } else {
      logger.error('Failed to authentice');
    }
  };

  useEffect(() => {
    if (response && response?.type === 'success') {
      handleAuth();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [response]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Button
        title="login"
        disabled={!request}
        onPress={() => {
          promptAsync();
        }}
      />
    </View>
  );
};

export default LoginScreen;
