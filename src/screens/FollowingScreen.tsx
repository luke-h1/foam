import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { toast } from 'sonner-native';

import { EditorialSectionHeader } from '@app/components/EditorialSectionHeader/EditorialSectionHeader';
import { FlashList, ListRenderItem } from '@app/components/FlashList/FlashList';
import { MemoizedLiveStreamCard } from '@app/components/LiveStreamCard/LiveStreamCard';
import { LiveStreamCardSkeleton } from '@app/components/LiveStreamCard/LiveStreamCardSkeleton';
import { MemoizedOfflineChannelRow } from '@app/components/OfflineChannelRow/OfflineChannelRow';
import { useBottomTabOverflow } from '@app/components/TabBarBackground/useBottomTabOverflow';
import { EmptyState } from '@app/components/ui/EmptyState/EmptyState';
import { Text } from '@app/components/ui/Text/Text';
import { useAuthContext } from '@app/context/AuthContext';
import { useFollowedChannelsQuery } from '@app/hooks/queries/useFollowedChannelsQuery';
import { useFollowedStreamsQuery } from '@app/hooks/queries/useFollowedStreamsQuery';
import { useStreamProfilePictures } from '@app/hooks/queries/useStreamProfilePictures';
import { useRefetchOnForeground } from '@app/hooks/useRefetchOnForeground';
import { useScrollToTop } from '@app/hooks/useScrollToTop';
import { twitchKeys } from '@app/lib/react-query/query-keys';
import { usePreference } from '@app/store/preferenceStore';
import { theme } from '@app/styles/themes';
import type { FollowedChannelWithProfile } from '@app/types/twitch/channel';
import type { TwitchStream } from '@app/types/twitch/stream';

type FollowingListItem =
  | { type: 'stream'; stream: TwitchStream }
  | { type: 'offlineHeader' }
  | { type: 'offlineChannel'; channel: FollowedChannelWithProfile };

function FollowingSkeleton({
  showHeader,
  streamListLayout,
}: {
  showHeader?: boolean;
  streamListLayout: 'compact' | 'media';
}) {
  return (
    <ScrollView
      contentInsetAdjustmentBehavior='automatic'
      scrollEnabled={false}
      style={styles.container}
    >
      {showHeader && (
        <View style={styles.header}>
          <View style={styles.headerEyebrow} />
        </View>
      )}
      <LiveStreamCardSkeleton layout={streamListLayout} />
      <LiveStreamCardSkeleton layout={streamListLayout} />
      <LiveStreamCardSkeleton layout={streamListLayout} />
      <LiveStreamCardSkeleton layout={streamListLayout} />
      <LiveStreamCardSkeleton layout={streamListLayout} />
    </ScrollView>
  );
}

const FollowingListHeader = memo(function FollowingListHeader() {
  return (
    <View>
      <EditorialSectionHeader eyebrow='For you' />
      <View style={styles.header} />
    </View>
  );
});

const followingListHeader = <FollowingListHeader />;

const getFollowingItemKey = (item: FollowingListItem) =>
  item.type === 'stream'
    ? `stream-${item.stream.id}`
    : item.type === 'offlineChannel'
      ? `offline-${item.channel.broadcaster_id}`
      : 'offline-header';

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
  } = useFollowedStreamsQuery(user?.id as string, {
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

  const rawStreamsArray = useMemo(
    () => (Array.isArray(streams) ? streams : []),
    [streams],
  );
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
    if (!Array.isArray(followedChannels)) {
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
    const items: FollowingListItem[] = streamsArray.map(stream => ({
      type: 'stream',
      stream,
    }));
    if (offlineChannels.length > 0) {
      items.push({ type: 'offlineHeader' });
      items.push(
        ...offlineChannels.map(channel => ({
          type: 'offlineChannel' as const,
          channel,
        })),
      );
    }
    return items;
  }, [streamsArray, offlineChannels]);

  const hasShownErrorToast = useRef(false);
  const listRef = useRef(null);

  useScrollToTop(listRef);

  useEffect(() => {
    if (!isError) {
      hasShownErrorToast.current = false;
      return;
    }

    if (isFetched && !hasShownErrorToast.current) {
      hasShownErrorToast.current = true;
      toast.error('Failed to fetch followed streams');
    }
  }, [isError, isFetched]);

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
        case 'offlineHeader':
          return (
            <View style={styles.offlineHeaderRow}>
              <Text
                type='xs'
                weight='semibold'
                color='gray.textLow'
                style={styles.offlineHeaderTitle}
              >
                Offline channels
              </Text>
            </View>
          );
        case 'offlineChannel':
          return <MemoizedOfflineChannelRow channel={item.channel} />;
      }
    },
    [streamListLayout],
  );

  const stickyHeaderIndices = useMemo(
    () => (offlineChannels.length > 0 ? [streamsArray.length] : undefined),
    [offlineChannels.length, streamsArray.length],
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
        button='Sign In'
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
    return <FollowingSkeleton showHeader streamListLayout={streamListLayout} />;
  }

  if (!user?.id) {
    return (
      <EmptyState
        button={null}
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
        button='Refresh'
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
        data={listItems}
        keyExtractor={getFollowingItemKey}
        contentInsetAdjustmentBehavior='automatic'
        drawDistance={500}
        getItemType={getFollowingItemType}
        ListHeaderComponent={followingListHeader}
        stickyHeaderIndices={stickyHeaderIndices}
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
  header: {
    borderBottomColor: theme.color.border.dark,
    borderBottomWidth: 1,
    marginBottom: theme.space12,
    marginHorizontal: theme.space16,
    minHeight: theme.space12,
  },
  headerEyebrow: {
    backgroundColor: theme.colorPrimary,
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius999,
    height: 6,
    marginBottom: theme.space20,
    opacity: 0.85,
    width: 56,
  },
  listContent: {
    paddingBottom: theme.space20,
  },
  offlineHeaderRow: {
    backgroundColor: theme.color.background.dark,
    paddingBottom: theme.space8,
    paddingHorizontal: theme.space16,
    paddingTop: theme.space20,
  },
  offlineHeaderTitle: {
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  stateContainer: {
    alignItems: 'center',
    backgroundColor: theme.color.background.dark,
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: theme.space20,
  },
});
