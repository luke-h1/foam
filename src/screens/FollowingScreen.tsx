import { Spinner, EmptyState, LiveStreamCard, Screen } from '@app/components';
import { useAuthContext } from '@app/context/AuthContext';
import { useHeader } from '@app/hooks';
import { twitchQueries } from '@app/queries/twitchQueries';
import { Stream } from '@app/services';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { FlatList, View, RefreshControl, ScrollView } from 'react-native';

export interface Section {
  key: string;
  render: () => JSX.Element;
  isTitle?: boolean;
}

export default function FollowingScreen() {
  const { user } = useAuthContext();
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const queryClient = useQueryClient();

  useHeader({
    title: 'Following',
  });

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
    [user],
  );

  const { data: streams, isLoading, isError } = useQuery(followingStreamsQuery);

  if (refreshing || isLoading) {
    return <Spinner />;
  }

  if ((!isLoading && !streams) || isError) {
    return (
      <ScrollView
        contentContainerStyle={{ flex: 1 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <EmptyState
          buttonOnPress={() => onRefresh()}
          heading="Failed to fetch followed streams"
        />
      </ScrollView>
    );
  }

  return (
    <Screen>
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
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          />
        </View>
      </View>
    </Screen>
  );
}
