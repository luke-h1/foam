import { Button } from '@app/components/Button/Button';
import { EmptyState } from '@app/components/ui/EmptyState/EmptyState';
import {
  FlashList,
  type FlashListRef,
  type ListRenderItem,
} from '@app/components/FlashList/FlashList';
import { IconButton } from '@app/components/IconButton/IconButton';
import { Image } from '@app/components/Image/Image';
import { LoadingState } from '@app/components/LoadingState/LoadingState';
import { Text } from '@app/components/ui/Text/Text';
import { useDownloadTwitchClip } from '@app/hooks/useDownloadTwitchClip';
import { useInfiniteQueryLoadMore } from '@app/hooks/useInfiniteQueryLoadMore';
import { useScrollToTop } from '@app/hooks/useScrollToTop';
import { twitchQueries } from '@app/queries/twitchQueries';
import {
  type TwitchClip,
  type UserInfoResponse,
  twitchService,
} from '@app/services/twitch-service';
import { theme } from '@app/styles/themes';
import { flattenInfiniteQueryPages } from '@app/utils/pagination/flattenInfiniteQueryPages';
import { shareDeepLink } from '@app/utils/sharing/shareDeepLink';
import { formatViewCount } from '@app/utils/string/formatViewCount';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useRef, useCallback } from 'react';
import { Platform, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { toast } from 'sonner-native';

interface StreamerProfileScreenProps {
  id: string;
}

type ClipListItem = TwitchClip;

function getClipThumbnailUrl(clip: TwitchClip) {
  return clip.thumbnail_url
    .replace('-preview-480x272', '-preview-640x360')
    .replace('-preview-260x147', '-preview-640x360');
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

function StreamerProfileHeader({
  clipCount,
  user,
}: {
  clipCount: number;
  user: UserInfoResponse;
}) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.header, { paddingTop: insets.top + theme.space16 }]}>
      <View style={styles.navRow}>
        <IconButton
          icon={{ type: 'symbol', name: 'square.and.arrow.up', size: 18 }}
          label={`Share ${user.display_name}`}
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
          label='Close streamer profile'
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

      <View style={styles.sectionRow}>
        <Text type='lg' weight='bold'>
          Clips
        </Text>
        <Text type='xs' color='gray.textLow'>
          {clipCount > 0 ? `${clipCount} loaded` : 'Top clips'}
        </Text>
      </View>
    </View>
  );
}

function ClipCard({
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
            {clip.title || 'Untitled clip'}
          </Text>
          <Text type='xs' color='gray.textLow' numberOfLines={1}>
            {formatViewCount(clip.view_count)} views -{' '}
            {formatRelativeAge(clip.created_at)}
          </Text>
          <Text type='xs' color='gray.textLow' numberOfLines={1}>
            Clipped by {clip.creator_name}
          </Text>
        </Button>

        <IconButton
          icon={{
            type: 'symbol',
            name: 'arrow.down.circle',
            size: 20,
            color: theme.color.text.dark,
          }}
          label={`Download ${clip.title}`}
          loading={downloading}
          onPress={() => onDownload(clip)}
          size='2xl'
          style={styles.downloadButton}
        />
      </View>
    </View>
  );
}

export function StreamerProfileScreen({ id }: StreamerProfileScreenProps) {
  const listRef = useRef<FlashListRef<ClipListItem>>(null);
  const { width: windowWidth } = useWindowDimensions();
  const { download, downloadingClipId } = useDownloadTwitchClip();

  useScrollToTop(listRef);

  const {
    data: user,
    isError: isUserError,
    isLoading: isUserLoading,
    refetch: refetchUser,
  } = useQuery({
    queryKey: ['user', id],
    queryFn: () => twitchService.getUser(id),
    enabled: Boolean(id),
  });

  const broadcasterId = user?.id ?? '';

  const {
    data: clipPages,
    fetchNextPage,
    hasNextPage,
    isError: isClipsError,
    isFetchingNextPage,
    isLoading: isClipsLoading,
    refetch: refetchClips,
  } = useInfiniteQuery({
    ...twitchQueries.getClipsInfinite({ broadcasterId, first: 20 }),
    enabled: Boolean(broadcasterId),
    initialPageParam: undefined,
    getNextPageParam: lastPage => lastPage?.pagination?.cursor || undefined,
  });

  const clips = flattenInfiniteQueryPages(clipPages?.pages);

  const cardWidth =
    Platform.OS === 'web' && windowWidth >= 820
      ? Math.min(420, (windowWidth - theme.space20 * 3) / 2)
      : windowWidth - theme.space20 * 2;
  const columns = Platform.OS === 'web' && windowWidth >= 820 ? 2 : 1;

  const handleLoadMore = useInfiniteQueryLoadMore({
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  });

  const handleDownload = (clip: TwitchClip) => {
    download(
      { clip },
      {
        onError: error => toast.error(error.message),
        onSuccess: () => toast.success('Clip saved'),
      },
    );
  };

  const renderItem: ListRenderItem<ClipListItem> = ({ item }) => (
    <ClipCard
      clip={item}
      downloading={downloadingClipId === item.id}
      onDownload={handleDownload}
      width={cardWidth}
    />
  );

  const listHeader = user ? (
    <StreamerProfileHeader user={user} clipCount={clips.length} />
  ) : null;

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

  if (isClipsError) {
    return (
      <EmptyState
        heading='Clips unavailable'
        content='Could not load clips for this channel.'
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        buttonOnPress={() => refetchClips()}
      />
    );
  }

  if (isClipsLoading) {
    return (
      <View style={styles.container}>
        {listHeader}
        <View style={styles.centeredBody}>
          <LoadingState indicatorSize='small' style={styles.inlineLoading} />
        </View>
      </View>
    );
  }

  if (clips.length === 0) {
    return (
      <View style={styles.container}>
        {listHeader}
        <View style={styles.centeredBody}>
          <Text type='sm' color='gray.textLow'>
            No clips found.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlashList<ClipListItem>
        ref={listRef}
        data={clips}
        extraData={downloadingClipId}
        key={columns}
        numColumns={columns}
        contentInsetAdjustmentBehavior='automatic'
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={listHeader}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        getItemType={() => 'streamer-clip'}
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
    alignItems: 'baseline',
    borderTopColor: theme.colorBorderSecondary,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: theme.space20,
    paddingTop: theme.space16,
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
