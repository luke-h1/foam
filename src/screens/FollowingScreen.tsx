import { EmptyState, LiveStreamCard, Screen } from '@app/components';
import { LiveStreamCardSkeleton } from '@app/components/LiveStreamCard/LiveStreamCardSkeleton';
import { useAuthContext } from '@app/context/AuthContext';
import { useHeader } from '@app/hooks';
import { twitchQueries } from '@app/queries/twitchQueries';
import { Stream } from '@app/services';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useMemo, useState, JSX } from 'react';
import { FlatList, View, RefreshControl } from 'react-native';
import { toast } from 'sonner-native';

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
    return (
      <>
        {Array.from({ length: 5 }).map((_, index) => (
          // eslint-disable-next-line react/no-array-index-key
          <LiveStreamCardSkeleton key={index} />
        ))}
      </>
    );
  }
  if ((!isLoading && !streams) || isError) {
    toast.error('Failed to fetch followed streams');
    return (
      <EmptyState
        content="Failed to fetch followed streams"
        heading="No followed streams"
      />
    );
  }

  if (streams && streams.length === 0) {
    return (
      <EmptyState
        content="None of your followed streamers are live"
        heading="It's empty in here"
      />
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
            showsVerticalScrollIndicator={false}
            refreshControl={
              // eslint-disable-next-line @typescript-eslint/no-misused-promises
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          />
        </View>
      </View>
    </Screen>
  );
}
