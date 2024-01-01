import { AntDesign } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Constants from 'expo-constants';
import { useMemo, useState } from 'react';
import { FlatList, SafeAreaView, Platform } from 'react-native';
import { RefreshControl } from 'react-native-gesture-handler';
import { Main, ScrollView, Spinner, Stack, Text } from 'tamagui';
import StreamCard from '../components/ui/StreamCard';
import { useAuthContext } from '../context/AuthContext';
import twitchQueries from '../queries/twitchQueries';
import { Stream } from '../services/twitchService';
import colors from '../styles/colors';

export interface Section {
  key: string;
  render: () => JSX.Element;
  isTitle?: boolean;
}

const FollowingScreen = () => {
  const { user } = useAuthContext();
  const [refreshing, setRefreshing] = useState(false);
  const queryClient = useQueryClient();

  const onRefresh = async () => {
    setRefreshing(true);
    await queryClient.refetchQueries({
      queryKey: followingStreamsQuery.queryKey,
    });

    setRefreshing(false);
  };

  const followingStreamsQuery = useMemo(
    () => twitchQueries.getFollowedStreams(user?.id as string),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const { data: streams, isLoading, isError } = useQuery(followingStreamsQuery);

  if ((!isLoading && !streams?.length) || isError) {
    return (
      <Stack
        display="flex"
        justifyContent="center"
        alignItems="center"
        flex={1}
      >
        <Stack display="flex" flexDirection="row" alignItems="center">
          <AntDesign
            name="infocirlceo"
            size={24}
            color="black"
            style={{
              marginRight: 10,
            }}
          />
          <Text>No streams are live</Text>
        </Stack>
      </Stack>
    );
  }

  if (refreshing || isLoading) {
    return <Spinner color={colors.gray} size="large" />;
  }

  return (
    <Stack>
      <SafeAreaView>
        <ScrollView
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.gray}
              colors={[colors.gray]}
            />
          }
        >
          <Main padding={4}>
            <Stack>
              <FlatList<Stream>
                data={streams}
                keyExtractor={item => item.id}
                renderItem={({ item }) => <StreamCard stream={item} />}
              />
            </Stack>
          </Main>
        </ScrollView>
      </SafeAreaView>
    </Stack>
  );
};

export default FollowingScreen;

export const statusBarHeight =
  Platform.OS === 'android' ? Constants.statusBarHeight : 0;
