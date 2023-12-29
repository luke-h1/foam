import Constants from 'expo-constants';
import { useEffect, useState } from 'react';
import { FlatList, SafeAreaView, Platform } from 'react-native';
import { Main, Stack } from 'tamagui';
import StreamCard from '../components/ui/StreamCard';
import { useAuthContext } from '../context/AuthContext';
import twitchService, { Stream } from '../services/twitchService';

export interface Section {
  key: string;
  render: () => JSX.Element;
  isTitle?: boolean;
}

const FollowingScreen = () => {
  const { user } = useAuthContext();
  const [streams, setStreams] = useState<Stream[]>([]);

  const fetchFollowedStreams = async () => {
    try {
      const res = await twitchService.getFollowedStreams(user?.id as string);
      setStreams(res);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
    }
  };

  useEffect(() => {
    fetchFollowedStreams();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Stack>
      <SafeAreaView>
        <Main padding={4}>
          <Stack>
            <FlatList<Stream>
              data={streams}
              keyExtractor={item => item.id}
              renderItem={({ item }) => <StreamCard stream={item} />}
            />
          </Stack>
        </Main>
      </SafeAreaView>
    </Stack>
  );
};

export default FollowingScreen;

export const statusBarHeight =
  Platform.OS === 'android' ? Constants.statusBarHeight : 0;
