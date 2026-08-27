import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, StyleSheet, useWindowDimensions, View } from 'react-native';

import { router, Stack } from 'expo-router';

import { Button } from '@app/components/Button/Button';
import {
  FlashList,
  type FlashListRef,
  type ListRenderItem,
} from '@app/components/FlashList/FlashList';
import { IconButton } from '@app/components/IconButton/IconButton';
import { Image } from '@app/components/Image/Image';
import { LoadingState } from '@app/components/LoadingState/LoadingState';
import { SegmentedControl } from '@app/components/SegmentedControl/SegmentedControl';
import { EmptyState } from '@app/components/ui/EmptyState/EmptyState';
import { Text } from '@app/components/ui/Text/Text';
import { useClipsQuery } from '@app/hooks/queries/useClipsQuery';
import { useStreamElementsStatsQuery } from '@app/hooks/queries/useStreamelementsStatsQuery';
import { useUserQuery } from '@app/hooks/queries/useUserQuery';
import { useVideosQuery } from '@app/hooks/queries/useVideosQuery';
import { useFlattenedInfiniteQuery } from '@app/hooks/useFlattenedInfiniteQuery';
import { useInfiniteQueryLoadMore } from '@app/hooks/useInfiniteQueryLoadMore';
import { useScrollToTop } from '@app/hooks/useScrollToTop';
import { theme } from '@app/styles/themes';
import type { StreamElementsChatStats } from '@app/types/streamelements/stats';
import type { TwitchClip } from '@app/types/twitch/clip';
import type { UserInfoResponse } from '@app/types/twitch/user';
import type { TwitchVideo } from '@app/types/twitch/video';
import { shareDeepLink } from '@app/utils/sharing/shareDeepLink';
import {
  formatViewCount,
  formatViewCountCompact,
} from '@app/utils/string/formatViewCount';

interface StreamerProfileScreenProps {
  id: string;
}

type ProfileTab = 'vods' | 'clips';

type ProfileListItem =
  { kind: 'clip'; clip: TwitchClip } | { kind: 'vod'; vod: TwitchVideo };

type ProfileListExtraData = {
  activeTab: ProfileTab;
};

function getClipThumbnailUrl(clip: TwitchClip) {
  return clip.thumbnail_url
    .replace('-preview-480x272', '-preview-640x360')
    .replace('-preview-260x147', '-preview-640x360');
}

function getVodThumbnailUrl(vod: TwitchVideo, fallback: string) {
  // In-progress recordings have no thumbnail yet - Twitch returns '' or a `_404_processing` placeholder that 403s; fall back to channel art.
  if (!vod.thumbnail_url || /_404|404_processing/.test(vod.thumbnail_url)) {
    return fallback;
  }

  return vod.thumbnail_url
    .replace(/%?\{width\}/, '640')
    .replace(/%?\{height\}/, '360');
}

function formatVodDuration(duration: string) {
  const match = /^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/.exec(duration);

  if (!match || (!match[1] && !match[2] && !match[3])) {
    return duration;
  }

  const hours = Number(match[1] ?? 0);
  const minutes = Number(match[2] ?? 0);
  const seconds = Number(match[3] ?? 0);
  const paddedMinutes = minutes.toString().padStart(hours > 0 ? 2 : 1, '0');
  const paddedSeconds = seconds.toString().padStart(2, '0');

  return hours > 0
    ? `${hours}:${paddedMinutes}:${paddedSeconds}`
    : `${paddedMinutes}:${paddedSeconds}`;
}

function getTopChatEmote(stats: StreamElementsChatStats) {
  return [
    ...stats.sevenTVEmotes,
    ...stats.bttvEmotes,
    ...stats.ffzEmotes,
    ...stats.twitchEmotes,
  ].reduce<(typeof stats.twitchEmotes)[number] | undefined>(
    (top, emote) => (!top || emote.amount > top.amount ? emote : top),
    undefined,
  );
}

function formatDuration(duration: number) {
  const totalSeconds = Math.max(0, Math.round(duration));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function formatRelativeAge(value: string) {
  const timestamp = new Date(value).getTime();

  if (!Number.isFinite(timestamp)) {
    return '';
  }

  const diffSeconds = Math.max(1, Math.floor((Date.now() - timestamp) / 1000));
  const units = [
    { label: 'y', seconds: 31_536_000 },
    { label: 'mo', seconds: 2_592_000 },
    { label: 'd', seconds: 86_400 },
    { label: 'h', seconds: 3_600 },
    { label: 'm', seconds: 60 },
  ] as const;
  const unit = units.find(item => diffSeconds >= item.seconds);

  if (!unit) {
    return 'now';
  }

  return `${Math.floor(diffSeconds / unit.seconds)}${unit.label} ago`;
}

function StreamElementsStats({ stats }: { stats: StreamElementsChatStats }) {
  const topEmote = getTopChatEmote(stats);

  return (
    <View style={styles.statsStrip}>
      <View style={styles.statsRow}>
        <View style={styles.statChip}>
          <Text type='sm' weight='bold'>
            {formatViewCountCompact(stats.totalMessages)}
          </Text>
          <Text type='xxs' color='gray.textLow'>
            messages
          </Text>
        </View>
        <View style={styles.statChip}>
          <Text type='sm' weight='bold'>
            {formatViewCountCompact(stats.uniqueChatters)}
          </Text>
          <Text type='xxs' color='gray.textLow'>
            chatters
          </Text>
        </View>
        {topEmote ? (
          <View style={styles.statChip}>
            <Text type='sm' weight='bold' numberOfLines={1}>
              {topEmote.emote}
            </Text>
            <Text type='xxs' color='gray.textLow'>
              Top emote
            </Text>
          </View>
        ) : null}
      </View>
      <Text type='xxs' color='gray.textLow' style={styles.statsAttribution}>
        via StreamElements
      </Text>
    </View>
  );
}

function StreamerProfileHeader({
  activeTab,
  loadedCount,
  onTabChange,
  streamElementsStats,
  user,
}: {
  activeTab: ProfileTab;
  loadedCount: number;
  onTabChange: (tab: ProfileTab) => void;
  streamElementsStats?: StreamElementsChatStats;
  user: UserInfoResponse;
}) {
  return (
    <View style={styles.header}>
      <View style={styles.profileRow}>
        <Image
          source={user.profile_image_url}
          cacheVariant='avatar'
          style={styles.avatar}
          contentFit='cover'
        />
        <View style={styles.profileCopy}>
          <Text type='xl' weight='bold' numberOfLines={1}>
            {user.display_name}
          </Text>
          <Text type='xs' color='gray.textLow' numberOfLines={1}>
            @{user.login}
          </Text>
        </View>
      </View>

      {user.description ? (
        <Text
          type='xs'
          color='gray.textLow'
          numberOfLines={2}
          style={styles.description}
        >
          {user.description}
        </Text>
      ) : null}

      {streamElementsStats ? (
        <StreamElementsStats stats={streamElementsStats} />
      ) : null}

      <View style={styles.sectionRow}>
        <SegmentedControl
          items={[{ label: 'VODs' }, { label: 'Clips' }]}
          currentIndex={activeTab === 'vods' ? 0 : 1}
          onChange={index => onTabChange(index === 0 ? 'vods' : 'clips')}
        />
      </View>

      <Text type='xs' color='gray.textLow' style={styles.sectionCaption}>
        {loadedCount > 0
          ? `${loadedCount} loaded`
          : activeTab === 'vods'
            ? 'Recent broadcasts'
            : 'Top clips'}
      </Text>
    </View>
  );
}

// Memoized so regex/Date formatting re-runs only for changed cards - extraData ticks re-render the list wrapper, not every visible card.
const VodCard = memo(function VodCard({
  vod,
  width,
  fallbackImage,
}: {
  vod: TwitchVideo;
  width: number;
  fallbackImage: string;
}) {
  const handleView = useCallback(() => {
    router.push(`/streams/vod/${encodeURIComponent(vod.id)}`);
  }, [vod.id]);

  return (
    <View style={[styles.clipCard, { width }]}>
      <Button onPress={handleView} style={styles.thumbnailButton}>
        <Image
          source={getVodThumbnailUrl(vod, fallbackImage)}
          cacheVariant='thumbnail'
          style={styles.thumbnail}
          contentFit='cover'
          transition={150}
        />
        <View style={styles.durationBadge}>
          <Text type='xxs' weight='bold' style={styles.badgeText}>
            {formatVodDuration(vod.duration)}
          </Text>
        </View>
      </Button>

      <Button onPress={handleView} style={styles.vodTextButton}>
        <Text type='sm' weight='bold' numberOfLines={2} style={styles.title}>
          {vod.title || 'Untitled broadcast'}
        </Text>
        <Text type='xs' color='gray.textLow' numberOfLines={1}>
          {`${formatViewCount(vod.view_count)} views - ${formatRelativeAge(vod.published_at || vod.created_at)}`}
        </Text>
      </Button>
    </View>
  );
});

const ClipCard = memo(function ClipCard({
  clip,
  width,
}: {
  clip: TwitchClip;
  width: number;
}) {
  const handleView = useCallback(() => {
    router.push(`/streams/clip/${encodeURIComponent(clip.id)}`);
  }, [clip.id]);

  return (
    <View style={[styles.clipCard, { width }]}>
      <Button onPress={handleView} style={styles.thumbnailButton}>
        <Image
          source={getClipThumbnailUrl(clip)}
          cacheVariant='thumbnail'
          style={styles.thumbnail}
          contentFit='cover'
          transition={150}
        />
        <View style={styles.durationBadge}>
          <Text type='xxs' weight='bold' style={styles.badgeText}>
            {formatDuration(clip.duration)}
          </Text>
        </View>
      </Button>

      <View style={styles.clipBody}>
        <Button onPress={handleView} style={styles.clipTextButton}>
          <Text type='sm' weight='bold' numberOfLines={2} style={styles.title}>
            {clip.title || 'Untitled clip'}
          </Text>
          <Text type='xs' color='gray.textLow' numberOfLines={1}>
            {`${formatViewCount(clip.view_count)} views - ${formatRelativeAge(clip.created_at)}`}
          </Text>
          <Text type='xs' color='gray.textLow' numberOfLines={1}>
            {`Clipped by ${clip.creator_name}`}
          </Text>
        </Button>
      </View>
    </View>
  );
});

function ProfileTabEmptyState({
  activeTab,
  isError,
  isLoading,
  onRetry,
}: {
  activeTab: ProfileTab;
  isError: boolean;
  isLoading: boolean;
  onRetry: () => void;
}) {
  if (isLoading) {
    return (
      <View style={styles.centeredBody}>
        <LoadingState indicatorSize='small' style={styles.inlineLoading} />
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.centeredBody}>
        <Text type='sm' weight='bold'>
          {activeTab === 'vods' ? 'VODs unavailable' : 'Clips unavailable'}
        </Text>
        <Text type='xs' color='gray.textLow' style={styles.emptyDescription}>
          {activeTab === 'vods'
            ? 'Could not load VODs for this channel.'
            : 'Could not load clips for this channel.'}
        </Text>
        <Button onPress={onRetry} style={styles.retryButton}>
          <Text type='sm' weight='semibold'>
            Refresh
          </Text>
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.centeredBody}>
      <Text type='sm' color='gray.textLow'>
        {activeTab === 'vods' ? 'No VODs found' : 'No clips found'}
      </Text>
    </View>
  );
}

export function StreamerProfileScreen({ id }: StreamerProfileScreenProps) {
  const listRef = useRef<FlashListRef<ProfileListItem>>(null);
  const { width: windowWidth } = useWindowDimensions();
  const [activeTab, setActiveTab] = useState<ProfileTab>('vods');

  useScrollToTop(listRef);

  const {
    data: user,
    isError: isUserError,
    isLoading: isUserLoading,
    refetch: refetchUser,
  } = useUserQuery(id, {
    enabled: Boolean(id),
  });

  const broadcasterId = user?.id ?? '';
  const enabled = Boolean(broadcasterId);

  const clipsQuery = useClipsQuery({ broadcasterId, first: 20 }, { enabled });
  const videosQuery = useVideosQuery(
    { userId: broadcasterId, first: 20 },
    {
      enabled,
    },
  );

  const streamElementsQuery = useStreamElementsStatsQuery(user?.login ?? '', {
    enabled: Boolean(user?.login),
  });

  const clips = useFlattenedInfiniteQuery(clipsQuery.data?.pages);
  const vods = useFlattenedInfiniteQuery(videosQuery.data?.pages);

  const cardWidth =
    Platform.OS === 'web' && windowWidth >= 820
      ? Math.min(420, (windowWidth - theme.space20 * 3) / 2)
      : windowWidth - theme.space20 * 2;
  const columns = Platform.OS === 'web' && windowWidth >= 820 ? 2 : 1;

  const handleLoadMoreClips = useInfiniteQueryLoadMore({
    fetchNextPage: clipsQuery.fetchNextPage,
    hasNextPage: clipsQuery.hasNextPage,
    isFetchingNextPage: clipsQuery.isFetchingNextPage,
  });
  const handleLoadMoreVods = useInfiniteQueryLoadMore({
    fetchNextPage: videosQuery.fetchNextPage,
    hasNextPage: videosQuery.hasNextPage,
    isFetchingNextPage: videosQuery.isFetchingNextPage,
  });

  const vodFallbackImage =
    user?.offline_image_url ?? user?.profile_image_url ?? '';

  const listExtraData = useMemo<ProfileListExtraData>(
    () => ({ activeTab }),
    [activeTab],
  );

  const renderItem: ListRenderItem<ProfileListItem> = useCallback(
    ({ item }) => {
      if (item.kind === 'clip') {
        return <ClipCard clip={item.clip} width={cardWidth} />;
      }

      return (
        <VodCard
          vod={item.vod}
          width={cardWidth}
          fallbackImage={vodFallbackImage}
        />
      );
    },
    [cardWidth, vodFallbackImage],
  );

  const isVods = activeTab === 'vods';
  const items = useMemo(
    (): ProfileListItem[] =>
      isVods
        ? vods.map(vod => ({ kind: 'vod' as const, vod }))
        : clips.map(clip => ({ kind: 'clip' as const, clip })),
    [clips, isVods, vods],
  );
  const isTabLoading = isVods ? videosQuery.isLoading : clipsQuery.isLoading;
  const isTabError = isVods ? videosQuery.isError : clipsQuery.isError;
  const handleLoadMore = isVods ? handleLoadMoreVods : handleLoadMoreClips;
  const refetchTab = isVods ? videosQuery.refetch : clipsQuery.refetch;

  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await refetchTab().finally(() => setIsRefreshing(false));
  }, [refetchTab]);

  useEffect(() => {
    listRef.current?.scrollToOffset({ offset: 0, animated: false });
  }, [activeTab]);

  const handleShare = useCallback(() => {
    if (!user) {
      return;
    }
    void shareDeepLink({
      kind: 'streamer',
      login: user.login,
      displayName: user.display_name,
    });
  }, [user]);

  if (isUserLoading) {
    return <LoadingState />;
  }

  if (isUserError || !user) {
    return (
      <EmptyState
        heading='Streamer not found'
        content='Could not load this channel.'
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        buttonOnPress={() => refetchUser()}
      />
    );
  }

  const listHeader = (
    <StreamerProfileHeader
      activeTab={activeTab}
      loadedCount={items.length}
      onTabChange={setActiveTab}
      streamElementsStats={streamElementsQuery.data}
      user={user}
    />
  );

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: user.display_name,
          headerRight: () => (
            <IconButton
              icon={{ type: 'symbol', name: 'square.and.arrow.up', size: 18 }}
              label={`Share ${user.display_name}`}
              onPress={handleShare}
              size='2xl'
            />
          ),
        }}
      />
      <FlashList<ProfileListItem>
        ref={listRef}
        data={items}
        extraData={listExtraData}
        key={`columns-${columns}`}
        numColumns={columns}
        contentInsetAdjustmentBehavior='automatic'
        indicatorStyle='white'
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={
          <ProfileTabEmptyState
            activeTab={activeTab}
            isError={isTabError}
            isLoading={isTabLoading}
            // eslint-disable-next-line @typescript-eslint/no-misused-promises
            onRetry={() => refetchTab()}
          />
        }
        renderItem={renderItem}
        keyExtractor={item =>
          item.kind === 'clip' ? item.clip.id : item.vod.id
        }
        getItemType={item => item.kind}
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.4}
        refreshing={isRefreshing}
        onRefresh={handleRefresh}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    borderColor: theme.colorBorderSecondary,
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius20,
    borderWidth: 1,
    height: 72,
    width: 72,
  },
  badgeText: {
    color: theme.color.text.dark,
  },
  centeredBody: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingBottom: theme.space56,
  },
  clipBody: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: theme.space12,
    paddingTop: theme.space12,
  },
  clipCard: {
    alignSelf: 'center',
    marginBottom: theme.space20,
  },
  clipTextButton: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  container: {
    backgroundColor: theme.color.background.dark,
    flex: 1,
  },
  description: {
    marginTop: theme.space16,
  },
  durationBadge: {
    backgroundColor: theme.colorBlackOverlay,
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius6,
    left: theme.space8,
    paddingHorizontal: theme.space8,
    paddingVertical: theme.space4,
    position: 'absolute',
    top: theme.space8,
  },
  header: {
    paddingBottom: theme.space20,
    paddingHorizontal: theme.space20,
    paddingTop: theme.space16,
  },
  listContent: {
    paddingBottom: theme.space36,
  },
  inlineLoading: {
    backgroundColor: 'transparent',
    flex: 0,
  },
  profileCopy: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  profileRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.space16,
  },
  sectionRow: {
    borderTopColor: theme.colorBorderSecondary,
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: theme.space20,
    paddingTop: theme.space16,
  },
  sectionCaption: {
    marginTop: theme.space8,
    textAlign: 'right',
  },
  statsStrip: {
    marginTop: theme.space16,
  },
  statsRow: {
    flexDirection: 'row',
    gap: theme.space8,
  },
  statChip: {
    backgroundColor: theme.darkActiveContent,
    borderColor: theme.colorBorderSecondary,
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius12,
    borderWidth: StyleSheet.hairlineWidth,
    flex: 1,
    gap: 2,
    paddingHorizontal: theme.space12,
    paddingVertical: theme.space8,
  },
  statsAttribution: {
    marginTop: theme.space8,
  },
  emptyDescription: {
    marginTop: theme.space4,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: theme.darkActiveContent,
    borderColor: theme.colorBorderSecondary,
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius999,
    borderWidth: 1,
    marginTop: theme.space16,
    paddingHorizontal: theme.space20,
    paddingVertical: theme.space8,
  },
  vodTextButton: {
    gap: 2,
    minWidth: 0,
    paddingTop: theme.space12,
  },
  thumbnail: {
    aspectRatio: 16 / 9,
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius16,
    width: '100%',
  },
  thumbnailButton: {
    position: 'relative',
  },
  title: {
    lineHeight: 22,
  },
});
