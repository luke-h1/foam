import { Flex } from '@app/components/Flex';
import StreamCard from '@app/components/StreamCard';
import { Text } from '@app/components/Text';
import Spinner from '@app/components/loading/Spinner';
import { useAuthContext } from '@app/context/AuthContext';
import twitchQueries from '@app/queries/twitchQueries';
import { Stream } from '@app/services/twitchService';
import { colors, iconSizes } from '@app/styles';
import { Info } from '@tamagui/lucide-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
// eslint-disable-next-line import/no-named-as-default
import Constants from 'expo-constants';
import { useMemo, useState } from 'react';
import { FlatList, SafeAreaView, Platform } from 'react-native';
import { RefreshControl } from 'react-native-gesture-handler';
import { Main, ScrollView, Stack } from 'tamagui';

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
          <Info
            size={24}
            color="$color"
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
    return (
      <Flex
        centered
        row
        flexDirection="row"
        gap="$spacing4"
        marginTop="$spacing60"
        padding="$spacing4"
      >
        <Spinner color="$neutral3" size={iconSizes.icon64} />
      </Flex>
    );
  }

  return (
    <Stack>
      <SafeAreaView>
        <ScrollView
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.gray150}
              colors={[colors.gray150]}
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
