import { Prompt, makeRedirectUri, useAuthRequest } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState } from 'react';
import { View, Button, Text } from 'react-native';
import { useAuthContext } from '../../context/AuthContext';
import { RootRoutes, RootStackScreenProps } from '../../navigation/RootStack';
import twitchService from '../../services/twitchService';

WebBrowser.maybeCompleteAuthSession();

const LoginScreen = ({
  navigation,
}: RootStackScreenProps<RootRoutes.Login>) => {
  const { setToken, token } = useAuthContext();
  const [valid, setValid] = useState(token?.accessToken ?? false);

  const discovery = {
    authorizationEndpoint: 'https://id.twitch.tv/oauth2/authorize',
    tokenEndpoint: 'https://id.twitch.tv/oauth2/token',
    revocationEndpoint: 'https://id.twitch.tv/oauth2/revoke',
  };

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
        force_verify: false,
      },
    },
    discovery,
  );

  useEffect(() => {
    if (response?.type === 'success') {
      if (!response.authentication) {
        return;
      }

      console.log(response)
      setToken(response.authentication);
      navigation.navigate(RootRoutes.Home);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [response]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      {!token?.accessToken && (
        <Button
          title="login"
          disabled={!request}
          onPress={() => {
            promptAsync();
          }}
        />
      )}
      {token && (
        <View>
          <Text>{JSON.stringify(token, null, 2)}</Text>
          <Button
            onPress={async () => {
              const res = await twitchService.validateToken(token.accessToken);
              setValid(res);
            }}
            title="validate token"
          />
          {valid ? <Text>Valid token</Text> : <Text>invalid token</Text>}
        </View>
      )}
    </View>
  );
};

export default LoginScreen;
