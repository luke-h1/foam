import LiveStreamCard from '@app/components/LiveStreamCard';
import { useAuthContext } from '@app/context/AuthContext';
import twitchQueries from '@app/queries/twitchQueries';
import { Stream } from '@app/services/twitchService';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { FlatList, View, Text } from 'react-native';

export interface Section {
  key: string;
  render: () => JSX.Element;
  isTitle?: boolean;
}

export default function FollowingScreen() {
  const { user } = useAuthContext();
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const queryClient = useQueryClient();

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

  if ((!isLoading && !streams) || isError) {
    return (
      <View
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          flex: 1,
        }}
      >
        <View
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <Text>No streams are live</Text>
        </View>
      </View>
    );
  }

  if (refreshing || isLoading) {
    return (
      <View>
        <Text>loading...</Text>
      </View>
    );
  }

  return (
    <View>
      <View
        style={{
          padding: 4,
        }}
      >
        <View>
          <FlatList<Stream>
            data={streams}
            keyExtractor={item => item.id}
            renderItem={({ item }) => <LiveStreamCard stream={item} />}
          />
        </View>
      </View>
    </View>
  );
}
