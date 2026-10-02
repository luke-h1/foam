import { useCallback, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';

import {
  FlashList,
  ListRenderItem,
} from '@app/components/flash-list/flash-list';
import { MemoizedLiveStreamCard } from '@app/components/live-stream-card/live-stream-card';
import { LiveStreamCardSkeleton } from '@app/components/live-stream-card/live-stream-card-skeleton';
import { MemoizedOfflineChannelRow } from '@app/components/offline-channel-row/offline-channel-row';
import { SectionHeader } from '@app/components/section-header/section-header';
import { EmptyState } from '@app/components/ui/empty-state/empty-state';
import { Text } from '@app/components/ui/text/text';
import { useAuthContext } from '@app/context/auth-context';
import { useFollowedChannelsQuery } from '@app/hooks/queries/use-followed-channels-query';
import { useStreamProfilePictures } from '@app/hooks/queries/use-stream-profile-pictures';
import { useBottomTabOverflow } from '@app/hooks/use-bottom-tab-overflow';
import { useRefetchOnForeground } from '@app/hooks/use-refetch-on-foreground';
import { useScrollToTop } from '@app/hooks/use-scroll-to-top';
import { followedStreamsQueryOptions } from '@app/lib/react-query/queries/twitch';
import { twitchKeys } from '@app/lib/react-query/query-keys';
import { markFirstScreenInteractive } from '@app/lib/startup-marks';
import { usePreference } from '@app/store/preference-store';
import { theme } from '@app/styles/themes';
import type { FollowedChannelWithProfile } from '@app/types/twitch/channel';
import type { TwitchStream } from '@app/types/twitch/stream';

type FollowingListItem =
  | { type: 'header'; title: string; count: number }
  | { type: 'stream'; stream: TwitchStream }
  | { type: 'noneLive' }
  | { type: 'offlineChannel'; channel: FollowedChannelWithProfile };

function FollowingSkeleton({
  streamListLayout,
}: {
  streamListLayout: 'compact' | 'media';
}) {
  return (
    <ScrollView
      contentInsetAdjustmentBehavior='automatic'
      scrollEnabled={false}
      style={styles.container}
    >
      <LiveStreamCardSkeleton layout={streamListLayout} />
      <LiveStreamCardSkeleton layout={streamListLayout} />
      <LiveStreamCardSkeleton layout={streamListLayout} />
      <LiveStreamCardSkeleton layout={streamListLayout} />
      <LiveStreamCardSkeleton layout={streamListLayout} />
    </ScrollView>
  );
}

const getFollowingItemKey = (item: FollowingListItem) => {
  if (item.type === 'stream') {
    return `stream-${item.stream.id}`;
  }

  if (item.type === 'offlineChannel') {
    return `offline-${item.channel.broadcaster_id}`;
  }

  if (item.type === 'header') {
    return `header-${item.title}`;
  }

  return 'none-live';
};

const getFollowingItemType = (item: FollowingListItem) => item.type;

export default function FollowingScreen() {
  const { authState, user } = useAuthContext();
  const queryClient = useQueryClient();
  const tabBarOverflow = useBottomTabOverflow();
  const streamListLayout = usePreference('streamListLayout');

  // SAFETY: both callers are gated on `user?.id` - the refresh handler renders past the logged-in guard, the foreground refetch runs under `enabled: Boolean(user?.id)`.
  const refetchFollowingStreams = useCallback(
    () =>
      queryClient.refetchQueries({
        queryKey: twitchKeys.followedStreams(user?.id as string),
      }),
    [user?.id, queryClient],
  );

  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefreshFollowing = useCallback(async () => {
    setIsRefreshing(true);
    await refetchFollowingStreams().finally(() => setIsRefreshing(false));
  }, [refetchFollowingStreams]);

  // SAFETY: the query only runs under `enabled: !!user?.id`, so the id is set whenever it is read.
  const {
    data: streams,
    isLoading,
    isFetching,
    isError,
    isFetched,
  } = useQuery({
    ...followedStreamsQueryOptions(user?.id as string),
    enabled: !!user?.id,
    retry: 2,
    retryDelay: (attemptIndex: number) =>
      Math.min(1000 * 2 ** attemptIndex, 3000),
    // useRefetchOnForeground handles focus/foreground refreshes; stacking refetchOnMount/refetchOnWindowFocus forced a network request on every tab switch.
  });

  useRefetchOnForeground({
    enabled: Boolean(user?.id),
    refetch: refetchFollowingStreams,
  });

  const rawStreamsArray = useMemo(() => streams ?? [], [streams]);

  const streamsArray = useStreamProfilePictures(
    rawStreamsArray,
    streamListLayout === 'media',
  );

  // SAFETY: the query only runs under `enabled: !!user?.id`, so the id is set whenever it is read.
  const { data: followedChannels, isLoading: isLoadingFollowedChannels } =
    useFollowedChannelsQuery(user?.id as string, {
      enabled: !!user?.id,
    });

  const offlineChannels = useMemo(() => {
    if (!followedChannels) {
      return [];
    }

    const liveBroadcasterIds = new Set(
      streamsArray.map(stream => stream.user_id),
    );

    return followedChannels.filter(
      channel => !liveBroadcasterIds.has(channel.broadcaster_id),
    );
  }, [followedChannels, streamsArray]);

  const listItems = useMemo<FollowingListItem[]>(() => {
    const items: FollowingListItem[] = [
      { type: 'header', title: 'Live', count: streamsArray.length },
    ];

    if (streamsArray.length === 0) {
      items.push({ type: 'noneLive' });
    }

    items.push(
      ...streamsArray.map(stream => ({ type: 'stream' as const, stream })),
    );

    if (offlineChannels.length > 0) {
      items.push({
        type: 'header',
        title: 'Offline',
        count: offlineChannels.length,
      });
      items.push(
        ...offlineChannels.map(channel => ({
          type: 'offlineChannel' as const,
          channel,
        })),
      );
    }

    return items;
  }, [streamsArray, offlineChannels]);

  const listRef = useRef(null);

  useScrollToTop(listRef);

  const renderItem: ListRenderItem<FollowingListItem> = useCallback(
    ({ item }) => {
      switch (item.type) {
        case 'stream':
          return (
            <MemoizedLiveStreamCard
              stream={item.stream}
              layout={streamListLayout}
            />
          );
        case 'header':
          return (
            <SectionHeader title={item.title} detail={String(item.count)} />
          );
        case 'noneLive':
          return (
            <Text type='subhead' color='gray.textLow' style={styles.noneLive}>
              Nobody you follow is live right now.
            </Text>
          );
        case 'offlineChannel':
          return <MemoizedOfflineChannelRow channel={item.channel} />;
      }
    },
    [streamListLayout],
  );

  const listContentStyle = useMemo(
    () => [
      styles.listContent,
      { paddingBottom: tabBarOverflow + theme.space20 },
    ],
    [tabBarOverflow],
  );

  if (!authState?.isLoggedIn) {
    return (
      <EmptyState
        button='Sign in'
        buttonOnPress={() => router.push('/auth-sheet')}
        content='Connect your Twitch account to see streams from channels you follow.'
        heading='Your followed streams'
        iconName='person.2'
        style={[styles.stateContainer, { paddingBottom: tabBarOverflow }]}
      />
    );
  }

  const showLoadingSkeleton =
    isLoading || (isFetching && streamsArray.length === 0);

  if (showLoadingSkeleton) {
    return <FollowingSkeleton streamListLayout={streamListLayout} />;
  }

  if (!user?.id) {
    return (
      <EmptyState
        content='Log in to see streams from channels you follow.'
        heading='Your followed streams'
        iconName='person.2'
        style={[styles.stateContainer, { paddingBottom: tabBarOverflow }]}
      />
    );
  }

  if (isFetched && isError) {
    return (
      <EmptyState
        button='Try again'
        buttonOnPress={() => void handleRefreshFollowing()}
        content='Twitch did not return your followed streams.'
        heading="Couldn't load following"
        iconName='exclamationmark.triangle'
        style={[styles.stateContainer, { paddingBottom: tabBarOverflow }]}
      />
    );
  }

  // The offline list resolves after the streams query; wait for it or the empty state flashes.
  if (
    !streams ||
    (streamsArray.length === 0 &&
      offlineChannels.length === 0 &&
      isLoadingFollowedChannels)
  ) {
    return <FollowingSkeleton streamListLayout={streamListLayout} />;
  }

  if (streamsArray.length === 0 && offlineChannels.length === 0) {
    return (
      <EmptyState
        button='Refresh'
        buttonOnPress={() => void handleRefreshFollowing()}
        content='None of your followed streamers are live right now.'
        heading='No one is live'
        iconName='antenna.radiowaves.left.and.right'
        style={[styles.stateContainer, { paddingBottom: tabBarOverflow }]}
      />
    );
  }

  return (
    <View style={styles.container}>
      <FlashList<FollowingListItem>
        ref={listRef}
        onLoad={markFirstScreenInteractive}
        data={listItems}
        keyExtractor={getFollowingItemKey}
        contentInsetAdjustmentBehavior='automatic'
        drawDistance={500}
        getItemType={getFollowingItemType}
        contentContainerStyle={listContentStyle}
        renderItem={renderItem}
        refreshing={isRefreshing}
        onRefresh={handleRefreshFollowing}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.color.background.dark,
    flex: 1,
    overflow: 'hidden',
  },
  listContent: {
    paddingBottom: theme.space20,
  },
  noneLive: {
    paddingBottom: theme.space8,
    paddingHorizontal: theme.space16,
  },
  stateContainer: {
    backgroundColor: theme.color.background.dark,
  },
});
