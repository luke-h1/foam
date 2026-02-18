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
import { useMemo, useCallback, useRef, useEffect, type JSX } from 'react';
import { Platform, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  const insets = useSafeAreaInsets();

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
    isFetched,
  } = useQuery({
    ...followingStreamsQuery,
    enabled: !!user?.id,
    retry: 2,
    retryDelay: (attemptIndex: number) =>
      Math.min(1000 * 2 ** attemptIndex, 3000),
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  const streamsArray = Array.isArray(streams) ? streams : [];
  const hasShownErrorToast = useRef(false);

  useEffect(() => {
    if (!isError) {
      hasShownErrorToast.current = false;
    }
  }, [isError]);

  const renderItem: ListRenderItem<TwitchStream> = useCallback(({ item }) => {
    return <LiveStreamCard stream={item} />;
  }, []);

  if (isRefreshing || isLoading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {Array.from({ length: 5 }).map((_, index) => (
          // eslint-disable-next-line react/no-array-index-key
          <LiveStreamCardSkeleton key={index} />
        ))}
      </View>
    );
  }

  if (!user?.id) {
    return (
      <EmptyState
        content="Log in to see streams from channels you follow"
        heading="Your followed streams"
      />
    );
  }

  if (isFetched && isError) {
    if (!hasShownErrorToast.current) {
      hasShownErrorToast.current = true;
      toast.error('Failed to fetch followed streams');
    }
    return (
      <EmptyState
        content="Failed to fetch followed streams"
        heading="No followed streams"
      />
    );
  }

  // Query enabled but not yet fetched (shouldn't happen after isLoading check, but guard for no data)
  if (!streams) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {Array.from({ length: 5 }).map((_, index) => (
          // eslint-disable-next-line react/no-array-index-key
          <LiveStreamCardSkeleton key={index} />
        ))}
      </View>
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
        drawDistance={Platform.OS === 'ios' ? 500 : undefined}
        contentContainerStyle={[styles.listContent, { paddingTop: insets.top }]}
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
  listContent: {
    paddingBottom: theme.spacing.lg,
  },
}));
