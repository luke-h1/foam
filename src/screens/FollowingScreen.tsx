import * as Clipboard from 'expo-clipboard';
import React from 'react';
import { Button, Text, View } from 'react-native';
import { useAuthContext } from '../context/AuthContext';
import twitchService from '../services/twitchService';

const FollowingScreen = () => {
  const { token } = useAuthContext();
  return (
    <View>
      <Text>Following Screen</Text>
      <Text selectable>
        Auth Details:
        {JSON.stringify(token, null, 2)}
      </Text>
      <Button
        title="copy access token"
        onPress={() => Clipboard.setStringAsync(token?.accessToken as string)}
      />

      <Button
        title="make api call"
        onPress={async () => {
          const res = await twitchService.getTopStreams(
            token?.accessToken as string,
          );
          console.log(res);
        }}
      />
    </View>
  );
};
export default FollowingScreen;
