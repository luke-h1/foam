import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';

import { useQuery } from '@tanstack/react-query';
import { router, Stack } from 'expo-router';

import { Button } from '@app/components/button/button';
import {
  FlashList,
  type FlashListRef,
  type ListRenderItem,
} from '@app/components/flash-list/flash-list';
import { IconButton } from '@app/components/icon-button/icon-button';
import { Image } from '@app/components/image/image';
import { SegmentedControl } from '@app/components/segmented-control/segmented-control';
import { EmptyState } from '@app/components/ui/empty-state/empty-state';
import { Skeleton } from '@app/components/ui/skeleton/skeleton';
import { Text } from '@app/components/ui/text/text';
import { useScrollToTop } from '@app/hooks/use-scroll-to-top';
import { streamElementsChatStatsQueryOptions } from '@app/lib/react-query/queries/streamelements';
import { userQueryOptions } from '@app/lib/react-query/queries/twitch';
import { theme } from '@app/styles/themes';
import type { StreamElementsChatStats } from '@app/types/streamelements/stats';
import type { TwitchClip } from '@app/types/twitch/clip';
import type { UserInfoResponse } from '@app/types/twitch/user';
import type { TwitchVideo } from '@app/types/twitch/video';
import { shareDeepLink } from '@app/utils/sharing/share-deep-link';
import {
  formatViewCount,
  formatViewCountCompact,
} from '@app/utils/string/format-view-count';

import { useStreamerProfileTab } from './hooks/use-streamer-profile-tab';
import type { ProfileListItem, ProfileTab } from './types';

interface StreamerProfileScreenProps {
  id: string;
}

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
    <View style={styles.stats}>
      <View style={styles.statsRow}>
        <Stat
          value={formatViewCountCompact(stats.totalMessages)}
          label='Messages'
        />
        <Stat
          value={formatViewCountCompact(stats.uniqueChatters)}
          label='Chatters'
        />
        {topEmote ? <Stat value={topEmote.emote} label='Top emote' /> : null}
      </View>
      <Text type='caption2' color='gray.textLow' align='center'>
        Chat stats from StreamElements
      </Text>
    </View>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.stat}>
      <Text type='headline' tabular numberOfLines={1}>
        {value}
      </Text>
      <Text type='caption' color='gray.textLow'>
        {label}
      </Text>
    </View>
  );
}

interface StreamerProfileHeaderProps {
  activeTab: ProfileTab;
  onTabChange: (tab: ProfileTab) => void;
  streamElementsStats?: StreamElementsChatStats;
  user: UserInfoResponse;
}

function StreamerProfileHeader({
  activeTab,
  onTabChange,
  streamElementsStats,
  user,
}: StreamerProfileHeaderProps) {
  return (
    <View style={styles.header}>
      <View style={styles.identity}>
        <Image
          source={user.profile_image_url}
          cacheVariant='avatar'
          style={styles.avatar}
          containerStyle={styles.avatar}
          contentFit='cover'
        />
        <Text type='title1' align='center' numberOfLines={1}>
          {user.display_name}
        </Text>
        <Text type='subhead' color='gray.textLow' numberOfLines={1}>
          @{user.login}
        </Text>
        {user.description ? (
          <Text
            type='subhead'
            color='gray.textLow'
            align='center'
            numberOfLines={3}
            style={styles.description}
          >
            {user.description}
          </Text>
        ) : null}
      </View>

      {streamElementsStats ? (
        <StreamElementsStats stats={streamElementsStats} />
      ) : null}

      <SegmentedControl
        items={[{ label: 'Videos' }, { label: 'Clips' }]}
        currentIndex={activeTab === 'vods' ? 0 : 1}
        onChange={index => onTabChange(index === 0 ? 'vods' : 'clips')}
      />
    </View>
  );
}

interface MediaCardProps {
  width: number;
  thumbnail: string;
  duration: string;
  title: string;
  meta: string;
  detail?: string;
  onPress: () => void;
}

/**
 * One press target per card: the thumbnail and the text act as one.
 */
function MediaCard({
  width,
  thumbnail,
  duration,
  title,
  meta,
  detail,
  onPress,
}: MediaCardProps) {
  return (
    <Button label={title} onPress={onPress} style={[styles.card, { width }]}>
      <View>
        <Image
          source={thumbnail}
          cacheVariant='thumbnail'
          style={styles.thumbnail}
          containerStyle={styles.thumbnail}
          contentFit='cover'
          transition={150}
        />
        <View style={styles.durationBadge}>
          <Text type='caption' weight='semibold' tabular>
            {duration}
          </Text>
        </View>
      </View>

      <View style={styles.cardText}>
        <Text type='callout' weight='semibold' numberOfLines={2}>
          {title}
        </Text>
        <Text type='subhead' color='gray.textLow' tabular numberOfLines={1}>
          {meta}
        </Text>
        {detail ? (
          <Text type='subhead' color='gray.textLow' numberOfLines={1}>
            {detail}
          </Text>
        ) : null}
      </View>
    </Button>
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
    <MediaCard
      width={width}
      thumbnail={getVodThumbnailUrl(vod, fallbackImage)}
      duration={formatVodDuration(vod.duration)}
      title={vod.title || 'Untitled broadcast'}
      meta={`${formatViewCount(vod.view_count)} views · ${formatRelativeAge(vod.published_at || vod.created_at)}`}
      onPress={handleView}
    />
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
    <MediaCard
      width={width}
      thumbnail={getClipThumbnailUrl(clip)}
      duration={formatDuration(clip.duration)}
      title={clip.title || 'Untitled clip'}
      meta={`${formatViewCount(clip.view_count)} views · ${formatRelativeAge(clip.created_at)}`}
      detail={`Clipped by ${clip.creator_name}`}
      onPress={handleView}
    />
  );
});

function MediaCardSkeleton({ width }: { width: number }) {
  return (
    <View style={[styles.card, { width }]}>
      <Skeleton style={styles.thumbnail} />
      <View style={styles.cardText}>
        <Skeleton style={styles.skeletonTitle} />
        <Skeleton style={styles.skeletonMeta} />
      </View>
    </View>
  );
}

interface ProfileTabEmptyStateProps {
  activeTab: ProfileTab;
  cardWidth: number;
  isError: boolean;
  isLoading: boolean;
  onRetry: () => void;
}

function ProfileTabEmptyState({
  activeTab,
  cardWidth,
  isError,
  isLoading,
  onRetry,
}: ProfileTabEmptyStateProps) {
  const isVods = activeTab === 'vods';

  if (isLoading) {
    return (
      <View>
        <MediaCardSkeleton width={cardWidth} />
        <MediaCardSkeleton width={cardWidth} />
      </View>
    );
  }

  if (isError) {
    return (
      <EmptyState
        iconName='exclamationmark.triangle'
        heading={isVods ? "Couldn't load videos" : "Couldn't load clips"}
        content='Check your connection and try again.'
        button='Try again'
        buttonOnPress={onRetry}
        style={styles.tabState}
      />
    );
  }

  return (
    <EmptyState
      iconName={isVods ? 'play.rectangle' : 'scissors'}
      heading={isVods ? 'No past broadcasts' : 'No clips yet'}
      content={
        isVods
          ? 'Past broadcasts appear here when the channel saves them.'
          : 'Clips people make on this channel appear here.'
      }
      style={styles.tabState}
    />
  );
}

function StreamerProfileSkeleton({ cardWidth }: { cardWidth: number }) {
  return (
    <ScrollView
      contentInsetAdjustmentBehavior='automatic'
      scrollEnabled={false}
      style={styles.container}
    >
      <View style={styles.header}>
        <View style={styles.identity}>
          <Skeleton style={styles.avatar} />
          <Skeleton style={styles.skeletonName} />
          <Skeleton style={styles.skeletonMeta} />
        </View>
      </View>
      <MediaCardSkeleton width={cardWidth} />
      <MediaCardSkeleton width={cardWidth} />
    </ScrollView>
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
  } = useQuery({ ...userQueryOptions(id), enabled: Boolean(id) });

  const broadcasterId = user?.id ?? '';

  const { handleLoadMore, isTabError, isTabLoading, items, refetchTab } =
    useStreamerProfileTab({ activeTab, broadcasterId });
  const streamElementsQuery = useQuery({
    ...streamElementsChatStatsQueryOptions(user?.login ?? ''),
    enabled: Boolean(user?.login),
  });

  const cardWidth =
    Platform.OS === 'web' && windowWidth >= 820
      ? Math.min(420, (windowWidth - theme.space20 * 3) / 2)
      : windowWidth - theme.space16 * 2;

  const columns = Platform.OS === 'web' && windowWidth >= 820 ? 2 : 1;

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
    return <StreamerProfileSkeleton cardWidth={cardWidth} />;
  }

  if (isUserError || !user) {
    return (
      <EmptyState
        iconName='person.crop.circle.badge.questionmark'
        heading='Streamer not found'
        content='Could not load this channel.'
        button='Try again'
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        buttonOnPress={() => refetchUser()}
      />
    );
  }

  const listHeader = (
    <StreamerProfileHeader
      activeTab={activeTab}
      onTabChange={setActiveTab}
      streamElementsStats={streamElementsQuery.data}
      user={user}
    />
  );

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          // The screen shows the name in its own header block, so the bar has no title.
          title: '',
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
            cardWidth={cardWidth}
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
    borderCurve: 'continuous',
    borderRadius: theme.radius.full,
    height: 88,
    overflow: 'hidden',
    width: 88,
  },
  card: {
    alignSelf: 'center',
    marginBottom: theme.space24,
  },
  cardText: {
    gap: 2,
    paddingTop: theme.space12,
  },
  container: {
    backgroundColor: theme.color.background.dark,
    flex: 1,
  },
  description: {
    marginTop: theme.space8,
    maxWidth: 360,
  },
  durationBadge: {
    backgroundColor: theme.color.scrim.dark,
    borderCurve: 'continuous',
    borderRadius: theme.radius.sm,
    bottom: theme.space8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    position: 'absolute',
    right: theme.space8,
  },
  header: {
    gap: theme.space24,
    paddingBottom: theme.space20,
    paddingHorizontal: theme.space16,
    paddingTop: theme.space8,
  },
  identity: {
    alignItems: 'center',
    gap: theme.space4,
  },
  listContent: {
    paddingBottom: theme.space36,
  },
  skeletonMeta: {
    height: 11,
    width: 120,
  },
  skeletonName: {
    height: 22,
    marginTop: theme.space8,
    width: 160,
  },
  skeletonTitle: {
    height: 13,
    width: '80%',
  },
  stat: {
    alignItems: 'center',
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  stats: {
    gap: theme.space8,
  },
  statsRow: {
    flexDirection: 'row',
  },
  tabState: {
    paddingTop: theme.space24,
  },
  thumbnail: {
    aspectRatio: 16 / 9,
    borderCurve: 'continuous',
    borderRadius: theme.radius.md,
    overflow: 'hidden',
    width: '100%',
  },
});
