import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

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
import i18next from '@app/i18n/i18next';
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
    <View style={styles.container}>
      {showHeader && (
        <View style={styles.header}>
          <View style={styles.headerEyebrow} />
        </View>
      )}
      {Array.from({ length: 5 }).map((_, index) => (
        // eslint-disable-next-line react/no-array-index-key
        <LiveStreamCardSkeleton key={index} layout={streamListLayout} />
      ))}
    </View>
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

export default function FollowingScreen() {
  const { t } = useTranslation(['stream', 'common']);
  const { authState, user } = useAuthContext();
  const queryClient = useQueryClient();
  const tabBarOverflow = useBottomTabOverflow();
  const streamListLayout = usePreference('streamListLayout');

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
    // Focus/foreground refreshes are handled by useRefetchOnForeground below;
    // stacking refetchOnMount/refetchOnWindowFocus on top forced a network
    // request on every tab switch regardless of staleness.
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
      toast.error(i18next.t('stream:failedToFetchFollowed'));
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
                {t('offlineChannels')}
              </Text>
            </View>
          );
        case 'offlineChannel':
          return <MemoizedOfflineChannelRow channel={item.channel} />;
      }
    },
    [streamListLayout, t],
  );

  const stickyHeaderIndices = useMemo(
    () => (offlineChannels.length > 0 ? [streamsArray.length] : undefined),
    [offlineChannels.length, streamsArray.length],
  );

  if (!authState?.isLoggedIn) {
    return (
      <EmptyState
        button={t('common:signIn')}
        buttonOnPress={() => router.push('/auth-sheet')}
        content={t('followingSignInPrompt')}
        heading={t('followingHeading')}
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
        content={t('followingLogInPrompt')}
        heading={t('followingHeading')}
        iconName='person.2'
        style={[styles.stateContainer, { paddingBottom: tabBarOverflow }]}
      />
    );
  }

  if (isFetched && isError) {
    return (
      <EmptyState
        button={t('common:refresh')}
        buttonOnPress={() => void handleRefreshFollowing()}
        content={t('followingLoadFailedDescription')}
        heading={t('followingLoadFailed')}
        iconName='exclamationmark.triangle'
        style={[styles.stateContainer, { paddingBottom: tabBarOverflow }]}
      />
    );
  }

  // The offline list resolves after the streams query (two-step fetch), so
  // wait for it before declaring nobody live or the empty state flashes.
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
        button={t('common:refresh')}
        buttonOnPress={() => void handleRefreshFollowing()}
        content={t('noOneIsLiveDescription')}
        heading={t('noOneIsLive')}
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
        keyExtractor={item =>
          item.type === 'stream'
            ? `stream-${item.stream.id}`
            : item.type === 'offlineChannel'
              ? `offline-${item.channel.broadcaster_id}`
              : 'offline-header'
        }
        contentInsetAdjustmentBehavior='automatic'
        drawDistance={500}
        getItemType={item => item.type}
        ListHeaderComponent={followingListHeader}
        stickyHeaderIndices={stickyHeaderIndices}
        contentContainerStyle={[
          styles.listContent,
          {
            paddingBottom: tabBarOverflow + theme.space20,
          },
        ]}
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
