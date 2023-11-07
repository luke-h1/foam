import { useTheme } from '@shopify/restyle';
import * as Clipboard from 'expo-clipboard';
import React from 'react';
import { Button, RefreshControl, Text, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import Box from '../components/Box';
import NavBar from '../components/NavBar';
import SafeAreaContainer from '../components/SafeAreaContainer';
import StreamList from '../components/StreamList';
import { useAuthContext } from '../context/AuthContext';
import { RootRoutes, RootStackScreenProps } from '../navigation/RootStack';
import twitchService from '../services/twitchService';

/* 
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
*/

const FollowingScreen = ({
  navigation,
}: RootStackScreenProps<RootRoutes.Home>) => {
  const { token } = useAuthContext();
  const theme = useTheme();

  return (
    <SafeAreaContainer>
      <Box testID="home" flex={1}>
        <NavBar />
        <ScrollView
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={() => {}}
              tintColor={theme.colors.secondaryText}
            />
          }
        />
        <StreamList size="small" streams={[]} listTitle='Your Live Channels' title='Following' />
      </Box>
    </SafeAreaContainer>
  );
};
export default FollowingScreen;
