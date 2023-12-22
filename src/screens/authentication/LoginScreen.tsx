/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-console */
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps } from '@react-navigation/native';
import { makeRedirectUri, useAuthRequest } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState } from 'react';
import { View, Button } from 'react-native';
import { useAuthContext } from '../../context/AuthContext';
import {
  HomeTabs,
  HomeTabsParamList,
  HomeTabsRoutes,
  HomeTabsScreenProps,
} from '../../navigation/Home/HomeTabs';
import { RootRoutes, RootStackScreenProps } from '../../navigation/RootStack';

WebBrowser.maybeCompleteAuthSession();

const LoginScreen = ({
  navigation,
}: RootStackScreenProps<RootRoutes.Login>) => {
  const { login } = useAuthContext();
  const { navigate } = navigation;

  const discovery = {
    authorizationEndpoint: 'https://id.twitch.tv/oauth2/authorize',
    tokenEndpoint: 'https://id.twitch.tv/oauth2/token',
    revocationEndpoint: 'https://id.twitch.tv/oauth2/revoke',
  } as const;

  const [request, response, promptAsync] = useAuthRequest(
    {
      clientId: process.env.EXPO_PUBLIC_TWITCH_CLIENT_ID as string,
      clientSecret: process.env.EXPO_PUBLIC_TWITCH_CLIENT_SECRET as string,
      scopes: [
        'chat:read chat:edit user:read:follows user:read:blocked_users user:manage:blocked_users',
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

  useEffect(() => {
    if (response?.type === 'success') {
      login(response);
      navigate(RootRoutes.Home);
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
