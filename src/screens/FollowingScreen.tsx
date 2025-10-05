import {
  EmptyState,
  LiveStreamCard,
  AnimatedFlashList,
  ListRenderItem,
} from '@app/components';
import { LiveStreamCardSkeleton } from '@app/components/LiveStreamCard/LiveStreamCardSkeleton';
import { RefreshControl } from '@app/components/RefreshControl';
import { useAuthContext } from '@app/context/AuthContext';
import { twitchQueries } from '@app/queries/twitchQueries';
import { TwitchStream } from '@app/services/twitch-service';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState, JSX, useCallback } from 'react';

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

  const onRefresh = async () => {
    setRefreshing(true);
    await queryClient.refetchQueries({
      queryKey: followingStreamsQuery.queryKey,
    });
    setRefreshing(false);
  };

  const followingStreamsQuery = useMemo(
    () => twitchQueries.getFollowedStreams(user?.id as string),

    [user],
  );

  const { data: streams, isLoading, isError } = useQuery(followingStreamsQuery);

  const renderItem: ListRenderItem<TwitchStream> = useCallback(({ item }) => {
    return <LiveStreamCard stream={item} />;
  }, []);

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
    <AnimatedFlashList<TwitchStream>
      data={streams}
      keyExtractor={item => item.id}
      renderItem={renderItem}
      refreshControl={<RefreshControl onRefresh={onRefresh} />}
    />
  );
}
