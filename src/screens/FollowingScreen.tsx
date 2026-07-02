import {
  type ReactElement,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { toast } from 'sonner-native';

import { EditorialSectionHeader } from '@app/components/EditorialSectionHeader/EditorialSectionHeader';
import { AnimatedFlashList } from '@app/components/FlashList/AnimatedFlashList';
import { ListRenderItem } from '@app/components/FlashList/FlashList';
import { MemoizedLiveStreamCard } from '@app/components/LiveStreamCard/LiveStreamCard';
import { LiveStreamCardSkeleton } from '@app/components/LiveStreamCard/LiveStreamCardSkeleton';
import { MemoizedOfflineChannelRow } from '@app/components/OfflineChannelRow/OfflineChannelRow';
import { StreamListLayoutToggle } from '@app/components/StreamListLayoutToggle/StreamListLayoutToggle';
import { useBottomTabOverflow } from '@app/components/TabBarBackground/useBottomTabOverflow';
import { EmptyState } from '@app/components/ui/EmptyState/EmptyState';
import { Text } from '@app/components/ui/Text/Text';
import { useAuthContext } from '@app/context/AuthContext';
import { useFollowedChannelsQuery } from '@app/hooks/queries/useFollowedChannelsQuery';
import { useFollowedStreamsQuery } from '@app/hooks/queries/useFollowedStreamsQuery';
import { useRefetchOnForeground } from '@app/hooks/useRefetchOnForeground';
import { useScrollToTop } from '@app/hooks/useScrollToTop';
import i18next from '@app/i18n/i18next';
import { twitchKeys } from '@app/lib/react-query/query-keys';
import {
  usePreference,
  useUpdatePreferences,
} from '@app/store/preferenceStore';
import { motion } from '@app/styles/motion';
import { theme } from '@app/styles/themes';
import type { FollowedChannelWithProfile } from '@app/types/twitch/channel';
import type { TwitchStream } from '@app/types/twitch/stream';

export interface Section {
  key: string;
  render: () => ReactElement;
  isTitle?: boolean;
}

type FollowingListItem =
  | { type: 'stream'; stream: TwitchStream }
  | { type: 'offlineHeader' }
  | { type: 'offlineChannel'; channel: FollowedChannelWithProfile };

export default function FollowingScreen() {
  const { t } = useTranslation(['stream', 'common']);
  const { authState, user } = useAuthContext();
  const queryClient = useQueryClient();
  const tabBarOverflow = useBottomTabOverflow();
  const streamListLayout = usePreference('streamListLayout');
  const updatePreferences = useUpdatePreferences();

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

  const layoutFade = useSharedValue(1);
  const layoutFadeStyle = useAnimatedStyle(() => ({
    opacity: layoutFade.get(),
  }));

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
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  useRefetchOnForeground({
    enabled: Boolean(user?.id),
    refetch: refetchFollowingStreams,
  });

  const streamsArray = Array.isArray(streams) ? streams : [];

  const { data: followedChannels } = useFollowedChannelsQuery(
    user?.id as string,
    {
      enabled: !!user?.id,
    },
  );

  const offlineChannels = useMemo(() => {
    if (!Array.isArray(followedChannels) || !Array.isArray(streams)) {
      return [];
    }
    const liveBroadcasterIds = new Set(streams.map(stream => stream.user_id));
    return followedChannels.filter(
      channel => !liveBroadcasterIds.has(channel.broadcaster_id),
    );
  }, [followedChannels, streams]);

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
    // streamsArray is a fresh array each render; streams is the stable query result.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [streams, offlineChannels]);

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

  const renderItem: ListRenderItem<FollowingListItem> = ({ item }) => {
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
            <Text type='md' weight='bold'>
              {t('offlineChannels')}
            </Text>
          </View>
        );
      case 'offlineChannel':
        return <MemoizedOfflineChannelRow channel={item.channel} />;
    }
  };

  // Soft dip-and-recover fade when switching layouts so rows do not
  // hard-cut between shapes.
  const setLayoutWithFade = (layout: 'compact' | 'media') => {
    if (layout === streamListLayout) {
      return;
    }
    layoutFade.set(0.35);
    layoutFade.set(
      withTiming(1, { duration: motion.medium, easing: motion.easing.out }),
    );
    updatePreferences({ streamListLayout: layout });
  };

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
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerEyebrow} />
        </View>
        {Array.from({ length: 5 }).map((_, index) => (
          // eslint-disable-next-line react/no-array-index-key
          <LiveStreamCardSkeleton key={index} layout={streamListLayout} />
        ))}
      </View>
    );
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

  if (!streams) {
    return (
      <View style={styles.container}>
        {Array.from({ length: 5 }).map((_, index) => (
          // eslint-disable-next-line react/no-array-index-key
          <LiveStreamCardSkeleton key={index} layout={streamListLayout} />
        ))}
      </View>
    );
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
      <Animated.View style={[styles.listFade, layoutFadeStyle]}>
        <AnimatedFlashList<FollowingListItem>
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
          drawDistance={Platform.OS === 'ios' ? 500 : undefined}
          getItemType={item => item.type}
          ListHeaderComponent={
            <View>
              <EditorialSectionHeader eyebrow='For you' />
              <View style={styles.layoutToggleRow}>
                <StreamListLayoutToggle
                  value={streamListLayout}
                  onChange={setLayoutWithFade}
                />
              </View>
              <View style={styles.header} />
            </View>
          }
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
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  listFade: {
    flex: 1,
  },
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
  layoutToggleRow: {
    alignItems: 'flex-end',
    marginBottom: theme.space8,
    marginHorizontal: theme.space16,
  },
  offlineHeaderRow: {
    borderTopColor: theme.color.border.dark,
    borderTopWidth: 1,
    marginHorizontal: theme.space16,
    marginTop: theme.space16,
    paddingBottom: theme.space8,
    paddingTop: theme.space16,
  },
  stateContainer: {
    alignItems: 'center',
    backgroundColor: theme.color.background.dark,
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: theme.space20,
  },
});
