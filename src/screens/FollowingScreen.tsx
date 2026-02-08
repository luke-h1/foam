import { EmptyState } from '@app/components/EmptyState/EmptyState';
import {
  AnimatedFlashList,
  ListRenderItem,
} from '@app/components/FlashList/FlashList';
import { LiveStreamCard } from '@app/components/LiveStreamCard/LiveStreamCard';
import { LiveStreamCardSkeleton } from '@app/components/LiveStreamCard/LiveStreamCardSkeleton';
import { RefreshIndicator } from '@app/components/RefreshControl/RefreshIndicator';
import { useAuthContext } from '@app/context/AuthContext';
import { useRefresh } from '@app/hooks/useRefresh';
import { twitchQueries } from '@app/queries/twitchQueries';
import { TwitchStream } from '@app/services/twitch-service';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useCallback, type JSX } from 'react';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { toast } from 'sonner-native';

export interface Section {
  key: string;
  render: () => JSX.Element;
  isTitle?: boolean;
}

export default function FollowingScreen() {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();

  const followingStreamsQuery = useMemo(
    () => twitchQueries.getFollowedStreams(user?.id as string),

    [user],
  );

  const { scrollHandler, scrollY, isRefreshing, refreshControl } = useRefresh({
    onRefresh: () =>
      queryClient.refetchQueries({
        queryKey: followingStreamsQuery.queryKey,
      }),
  });

  const {
    data: streams,
    isLoading,
    isError,
  } = useQuery({
    ...followingStreamsQuery,
    enabled: !!user?.id,
  });

  const streamsArray = Array.isArray(streams) ? streams : [];

  const renderItem: ListRenderItem<TwitchStream> = useCallback(({ item }) => {
    return <LiveStreamCard stream={item} />;
  }, []);

  if (isRefreshing || isLoading) {
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
    // Only show error toast if user is logged in (query was enabled)
    if (user?.id) {
      toast.error('Failed to fetch followed streams');
    }
    return (
      <EmptyState
        content="Failed to fetch followed streams"
        heading="No followed streams"
      />
    );
  }

  if (streamsArray.length === 0) {
    return (
      <EmptyState
        content="None of your followed streamers are live"
        heading="It's empty in here"
      />
    );
  }

  return (
    <View style={styles.container}>
      <RefreshIndicator scrollY={scrollY} isRefreshing={isRefreshing} />
      <AnimatedFlashList<TwitchStream>
        data={streamsArray}
        keyExtractor={item => item.id}
        contentInsetAdjustmentBehavior="automatic"
        renderItem={renderItem}
        onScroll={scrollHandler}
        refreshControl={refreshControl}
      />
    </View>
  );
}

const styles = StyleSheet.create(theme => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.gray.bg,
    overflow: 'hidden',
  },
}));
