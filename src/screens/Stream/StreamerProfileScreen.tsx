import { memo, useCallback, useMemo, useRef, useState } from 'react';
import { Platform, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { router } from 'expo-router';
import { toast } from 'sonner-native';

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
import { useDownloadTwitchClip } from '@app/hooks/useDownloadTwitchClip';
import { useFlattenedInfiniteQuery } from '@app/hooks/useFlattenedInfiniteQuery';
import { useInfiniteQueryLoadMore } from '@app/hooks/useInfiniteQueryLoadMore';
import { useScrollToTop } from '@app/hooks/useScrollToTop';
import i18next from '@app/i18n/i18next';
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

function getClipThumbnailUrl(clip: TwitchClip) {
  return clip.thumbnail_url
    .replace('-preview-480x272', '-preview-640x360')
    .replace('-preview-260x147', '-preview-640x360');
}

function getVodThumbnailUrl(vod: TwitchVideo, fallback: string) {
  // In-progress recordings (the broadcast is still live) have no generated
  // thumbnail yet - Twitch returns an empty string or a `_404_processing`
  // placeholder on vod-secure that responds 403. Fall back to the channel art.
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
    return i18next.t('stream:relativeAgeNow');
  }

  return i18next.t('stream:relativeAge', {
    age: `${Math.floor(diffSeconds / unit.seconds)}${unit.label}`,
  });
}

function StreamElementsStats({ stats }: { stats: StreamElementsChatStats }) {
  const { t } = useTranslation('stream');
  const topEmote = getTopChatEmote(stats);

  return (
    <View style={styles.statsStrip}>
      <View style={styles.statsRow}>
        <View style={styles.statChip}>
          <Text type='sm' weight='bold'>
            {formatViewCountCompact(stats.totalMessages)}
          </Text>
          <Text type='xxs' color='gray.textLow'>
            {t('messagesLabel')}
          </Text>
        </View>
        <View style={styles.statChip}>
          <Text type='sm' weight='bold'>
            {formatViewCountCompact(stats.uniqueChatters)}
          </Text>
          <Text type='xxs' color='gray.textLow'>
            {t('chattersLabel')}
          </Text>
        </View>
        {topEmote ? (
          <View style={styles.statChip}>
            <Text type='sm' weight='bold' numberOfLines={1}>
              {topEmote.emote}
            </Text>
            <Text type='xxs' color='gray.textLow'>
              {t('topEmoteStat')}
            </Text>
          </View>
        ) : null}
      </View>
      <Text type='xxs' color='gray.textLow' style={styles.statsAttribution}>
        {t('viaStreamElements')}
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
  const { t } = useTranslation('stream');
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.header, { paddingTop: insets.top + theme.space16 }]}>
      <View style={styles.navRow}>
        <IconButton
          icon={{ type: 'symbol', name: 'square.and.arrow.up', size: 18 }}
          label={t('shareUser', { name: user.display_name })}
          onPress={() => {
            void shareDeepLink({
              kind: 'streamer',
              login: user.login,
              displayName: user.display_name,
            });
          }}
          size='2xl'
          style={styles.closeButton}
        />
        <IconButton
          icon={{ type: 'symbol', name: 'xmark', size: 18 }}
          label={t('closeStreamerProfile')}
          onPress={() => router.back()}
          size='2xl'
          style={styles.closeButton}
        />
      </View>

      <View style={styles.profileRow}>
        <Image
          source={user.profile_image_url}
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
          items={[{ label: t('vods') }, { label: t('clips') }]}
          currentIndex={activeTab === 'vods' ? 0 : 1}
          onChange={index => onTabChange(index === 0 ? 'vods' : 'clips')}
        />
      </View>

      <Text type='xs' color='gray.textLow' style={styles.sectionCaption}>
        {loadedCount > 0
          ? activeTab === 'vods'
            ? t('vodsLoaded', { count: loadedCount })
            : t('clipsLoaded', { count: loadedCount })
          : activeTab === 'vods'
            ? t('recentVods')
            : t('topClips')}
      </Text>
    </View>
  );
}

// Memoized so the regex/Date formatting below only re-runs for cards whose
// props actually changed - extraData ticks (tab captions, download state)
// re-render the list wrapper, not every visible card.
const VodCard = memo(function VodCard({
  vod,
  width,
  fallbackImage,
}: {
  vod: TwitchVideo;
  width: number;
  fallbackImage: string;
}) {
  const { t } = useTranslation('stream');
  const handleView = useCallback(() => {
    router.push(`/streams/vod/${encodeURIComponent(vod.id)}`);
  }, [vod.id]);

  return (
    <View style={[styles.clipCard, { width }]}>
      <Button onPress={handleView} style={styles.thumbnailButton}>
        <Image
          source={getVodThumbnailUrl(vod, fallbackImage)}
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
          {vod.title || t('untitledVod')}
        </Text>
        <Text type='xs' color='gray.textLow' numberOfLines={1}>
          {t('vodMeta', {
            views: formatViewCount(vod.view_count),
            age: formatRelativeAge(vod.published_at || vod.created_at),
          })}
        </Text>
      </Button>
    </View>
  );
});

const ClipCard = memo(function ClipCard({
  clip,
  downloading,
  onDownload,
  width,
}: {
  clip: TwitchClip;
  downloading: boolean;
  onDownload: (clip: TwitchClip) => void;
  width: number;
}) {
  const { t } = useTranslation('stream');
  const handleView = useCallback(() => {
    router.push(`/streams/clip/${encodeURIComponent(clip.id)}`);
  }, [clip.id]);

  return (
    <View style={[styles.clipCard, { width }]}>
      <Button onPress={handleView} style={styles.thumbnailButton}>
        <Image
          source={getClipThumbnailUrl(clip)}
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
            {clip.title || t('untitledClip')}
          </Text>
          <Text type='xs' color='gray.textLow' numberOfLines={1}>
            {t('clipMeta', {
              views: formatViewCount(clip.view_count),
              age: formatRelativeAge(clip.created_at),
            })}
          </Text>
          <Text type='xs' color='gray.textLow' numberOfLines={1}>
            {t('clippedBy', { name: clip.creator_name })}
          </Text>
        </Button>

        <IconButton
          icon={{
            type: 'symbol',
            name: 'arrow.down.circle',
            size: 20,
            color: theme.color.text.dark,
          }}
          label={t('downloadClip', { title: clip.title })}
          loading={downloading}
          onPress={() => onDownload(clip)}
          size='2xl'
          style={styles.downloadButton}
        />
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
  const { t } = useTranslation('stream');

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
          {activeTab === 'vods' ? t('vodsUnavailable') : t('clipsUnavailable')}
        </Text>
        <Text type='xs' color='gray.textLow' style={styles.emptyDescription}>
          {activeTab === 'vods'
            ? t('vodsUnavailableDescription')
            : t('clipsUnavailableDescription')}
        </Text>
        <Button onPress={onRetry} style={styles.retryButton}>
          <Text type='sm' weight='semibold'>
            {t('refresh')}
          </Text>
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.centeredBody}>
      <Text type='sm' color='gray.textLow'>
        {activeTab === 'vods' ? t('noVods') : t('noClips')}
      </Text>
    </View>
  );
}

export function StreamerProfileScreen({ id }: StreamerProfileScreenProps) {
  const { t } = useTranslation('stream');
  const listRef = useRef<FlashListRef<ProfileListItem>>(null);
  const { width: windowWidth } = useWindowDimensions();
  const { download, downloadingClipId } = useDownloadTwitchClip();
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

  const handleDownload = useCallback(
    (clip: TwitchClip) => {
      download(
        { clip },
        {
          onError: error => toast.error(error.message),
          onSuccess: () => toast.success(i18next.t('stream:clipSaved')),
        },
      );
    },
    [download],
  );

  const vodFallbackImage =
    user?.offline_image_url ?? user?.profile_image_url ?? '';

  const renderItem: ListRenderItem<ProfileListItem> = useCallback(
    ({ item }) => {
      if (item.kind === 'clip') {
        return (
          <ClipCard
            clip={item.clip}
            downloading={downloadingClipId === item.clip.id}
            onDownload={handleDownload}
            width={cardWidth}
          />
        );
      }

      return (
        <VodCard
          vod={item.vod}
          width={cardWidth}
          fallbackImage={vodFallbackImage}
        />
      );
    },
    [cardWidth, downloadingClipId, handleDownload, vodFallbackImage],
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

  if (isUserLoading) {
    return <LoadingState />;
  }

  if (isUserError || !user) {
    return (
      <EmptyState
        heading={t('streamerNotFound')}
        content={t('streamerNotFoundDescription')}
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
      <FlashList<ProfileListItem>
        ref={listRef}
        data={items}
        extraData={`${activeTab}-${downloadingClipId}`}
        key={`${activeTab}-${columns}`}
        numColumns={columns}
        contentInsetAdjustmentBehavior='automatic'
        showsVerticalScrollIndicator={false}
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
  closeButton: {
    alignItems: 'center',
    backgroundColor: theme.darkActiveContent,
    borderColor: theme.colorBorderSecondary,
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius999,
    borderWidth: 1,
    justifyContent: 'center',
  },
  container: {
    backgroundColor: theme.color.background.dark,
    flex: 1,
  },
  description: {
    marginTop: theme.space16,
  },
  downloadButton: {
    alignItems: 'center',
    backgroundColor: theme.darkActiveContent,
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius999,
    justifyContent: 'center',
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
  },
  listContent: {
    paddingBottom: theme.space36,
  },
  inlineLoading: {
    backgroundColor: 'transparent',
    flex: 0,
  },
  navRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.space12,
    justifyContent: 'flex-end',
    marginBottom: theme.space12,
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
