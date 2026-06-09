import { EmptyState } from '@app/components/ui/EmptyState/EmptyState';
import { AnimatedFlashList } from '@app/components/FlashList/AnimatedFlashList';
import { ListRenderItem } from '@app/components/FlashList/FlashList';
import { Image } from '@app/components/Image/Image';
import { PressableArea } from '@app/components/PressableArea/PressableArea';
import { RefreshIndicator } from '@app/components/RefreshControl/RefreshIndicator';
import { useBottomTabOverflow } from '@app/components/TabBarBackground/useBottomTabOverflow';
import { Skeleton } from '@app/components/ui/Skeleton/Skeleton';
import { Text } from '@app/components/ui/Text/Text';
import { useAuthContext } from '@app/context/AuthContext';
import { useScrollToTop } from '@app/hooks/useScrollToTop';
import { useRefresh } from '@app/hooks/useRefresh';
import { useRefetchOnForeground } from '@app/hooks/useRefetchOnForeground';
import { twitchQueries } from '@app/queries/twitchQueries';
import { TwitchStream } from '@app/services/twitch-service';
import { theme } from '@app/styles/themes';
import { elapsedStreamTime } from '@app/utils/string/elapsedStreamTime';
import { formatViewCount } from '@app/utils/string/formatViewCount';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useEffect, useRef, useCallback } from 'react';
import { Platform, View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { toast } from 'sonner-native';

const SKELETON_COUNT = 8;

function StreamRowSkeleton() {
  return (
    <View style={styles.row}>
      <Skeleton style={styles.avatarSkeleton} />
      <View style={styles.rowBody}>
        <View style={styles.rowTop}>
          <Skeleton style={styles.skeletonName} />
          <Skeleton style={styles.skeletonMeta} />
        </View>
        <Skeleton style={styles.skeletonTitle} />
        <Skeleton style={styles.skeletonCategory} />
      </View>
      <Skeleton style={styles.thumbnailSkeleton} />
    </View>
  );
}

function StreamRow({ stream }: { stream: TwitchStream }) {
  const thumbnailUrl = stream.thumbnail_url
    .replace('{width}', '440')
    .replace('{height}', '248');

  const handlePress = useCallback(() => {
    router.push(`/streams/live-stream/${stream.user_login}`);
  }, [stream.user_login]);

  const handleStreamerPress = useCallback(() => {
    router.push(`/streams/streamer-profile/${stream.user_login}`);
  }, [stream.user_login]);

  const handleStreamerPressIn = useCallback(() => {
    router.prefetch(`/streams/streamer-profile/${stream.user_login}`);
  }, [stream.user_login]);

  const handleCategoryPress = useCallback(() => {
    router.push(`/category/${stream.game_id}`);
  }, [stream.game_id]);

  const avatarInitial = stream.user_name.trim().charAt(0).toUpperCase();

  return (
    <PressableArea onPress={handlePress} style={styles.row}>
      <PressableArea
        onPress={handleStreamerPress}
        onPressIn={handleStreamerPressIn}
        hitSlop={6}
      >
        {stream.profilePicture ? (
          <Image
            source={stream.profilePicture}
            style={styles.avatar}
            containerStyle={styles.avatarContainer}
            transition={100}
          />
        ) : (
          <View style={styles.avatarFallback}>
            <Text style={styles.avatarInitial}>{avatarInitial}</Text>
          </View>
        )}
      </PressableArea>

      <View style={styles.rowBody}>
        <View style={styles.rowTop}>
          <PressableArea
            onPress={handleStreamerPress}
            onPressIn={handleStreamerPressIn}
            hitSlop={4}
            style={styles.nameButton}
          >
            <Text type='sm' weight='semibold' numberOfLines={1} style={styles.streamerName}>
              {stream.user_name}
            </Text>
          </PressableArea>
          <Text type='xxs' style={styles.metaText} numberOfLines={1}>
            {formatViewCount(stream.viewer_count)} · {elapsedStreamTime(stream.started_at)}
          </Text>
        </View>

        <Text type='sm' numberOfLines={1} style={styles.title}>
          {stream.title}
        </Text>

        <PressableArea onPress={handleCategoryPress} hitSlop={4} style={styles.categoryButton}>
          <Text type='xxs' style={styles.category} numberOfLines={1}>
            {stream.game_name}
          </Text>
        </PressableArea>
      </View>

      <Image
        source={thumbnailUrl}
        style={styles.thumbnail}
        containerStyle={styles.thumbnailContainer}
        transition={100}
      />
    </PressableArea>
  );
}

const renderItem: ListRenderItem<TwitchStream> = ({ item }) => (
  <StreamRow stream={item} />
);

export default function FollowingScreen() {
  const { authState, user } = useAuthContext();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  const tabBarOverflow = useBottomTabOverflow();
  const listRef = useRef(null);

  useScrollToTop(listRef);

  const followingStreamsQuery = twitchQueries.getFollowedStreams(
    user?.id as string,
  );

  const refetchFollowingStreams = useCallback(
    () => queryClient.refetchQueries({ queryKey: followingStreamsQuery.queryKey }),
    [followingStreamsQuery.queryKey, queryClient],
  );

  const { scrollHandler, scrollY, isRefreshing, refreshControl } = useRefresh({
    onRefresh: refetchFollowingStreams,
  });

  const { data: streams, isLoading, isFetching, isError, isFetched } = useQuery({
    ...followingStreamsQuery,
    enabled: !!user?.id,
    retry: 2,
    retryDelay: (attempt: number) => Math.min(1000 * 2 ** attempt, 3000),
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  useRefetchOnForeground({
    enabled: Boolean(user?.id),
    refetch: refetchFollowingStreams,
  });

  const streamsArray = Array.isArray(streams) ? streams : [];
  const hasShownErrorToast = useRef(false);

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
    isRefreshing || isLoading || (isFetching && streamsArray.length === 0);

  if (showLoadingSkeleton) {
    return (
      <View style={styles.container}>
        <View style={[styles.listContent, { paddingTop: insets.top + theme.space12 }]}>
          {Array.from({ length: SKELETON_COUNT }).map((_, index) => (
            // eslint-disable-next-line react/no-array-index-key
            <StreamRowSkeleton key={index} />
          ))}
        </View>
      </View>
    );
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
        buttonOnPress={() => void refetchFollowingStreams()}
        content='Twitch did not return your followed streams.'
        heading="Couldn't load following"
        iconName='exclamationmark.triangle'
        style={[styles.stateContainer, { paddingBottom: tabBarOverflow }]}
      />
    );
  }

  if (!streams) {
    return (
      <View style={styles.container}>
        <View style={[styles.listContent, { paddingTop: insets.top + theme.space12 }]}>
          {Array.from({ length: SKELETON_COUNT }).map((_, index) => (
            // eslint-disable-next-line react/no-array-index-key
            <StreamRowSkeleton key={index} />
          ))}
        </View>
      </View>
    );
  }

  if (streamsArray.length === 0) {
    return (
      <EmptyState
        button='Refresh'
        buttonOnPress={() => void refetchFollowingStreams()}
        content='None of your followed streamers are live right now.'
        heading='No one is live'
        iconName='antenna.radiowaves.left.and.right'
        style={[styles.stateContainer, { paddingBottom: tabBarOverflow }]}
      />
    );
  }

  return (
    <View style={styles.container}>
      <RefreshIndicator
        scrollY={scrollY}
        isRefreshing={isRefreshing}
        contentInsetTop={insets.top}
      />
      <AnimatedFlashList<TwitchStream>
        ref={listRef}
        data={streamsArray}
        keyExtractor={item => item.id}
        contentInsetAdjustmentBehavior='automatic'
        drawDistance={Platform.OS === 'ios' ? 500 : undefined}
        renderItem={renderItem}
        estimatedItemSize={72}
        contentContainerStyle={{ paddingBottom: tabBarOverflow + theme.space20 }}
        onScroll={scrollHandler}
        refreshControl={refreshControl}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );
}

const AVATAR_SIZE = 44;
const THUMBNAIL_W = 88;
const THUMBNAIL_H = 50;

const styles = StyleSheet.create({
  avatar: {
    borderRadius: AVATAR_SIZE / 2,
    height: AVATAR_SIZE,
    width: AVATAR_SIZE,
  },
  avatarContainer: {
    borderRadius: AVATAR_SIZE / 2,
    height: AVATAR_SIZE,
    overflow: 'hidden',
    width: AVATAR_SIZE,
  },
  avatarFallback: {
    alignItems: 'center',
    backgroundColor: theme.darkActiveContent,
    borderRadius: AVATAR_SIZE / 2,
    height: AVATAR_SIZE,
    justifyContent: 'center',
    width: AVATAR_SIZE,
  },
  avatarInitial: {
    color: theme.color.text.dark,
    fontSize: 16,
    fontWeight: '700',
  },
  avatarSkeleton: {
    borderRadius: AVATAR_SIZE / 2,
    flexShrink: 0,
    height: AVATAR_SIZE,
    width: AVATAR_SIZE,
  },
  category: {
    color: theme.color.textSecondary.dark,
  },
  categoryButton: {
    alignSelf: 'flex-start',
  },
  container: {
    backgroundColor: theme.color.background.dark,
    flex: 1,
  },
  listContent: {
    paddingHorizontal: theme.space16,
  },
  metaText: {
    color: theme.color.textSecondary.dark,
    flexShrink: 0,
  },
  nameButton: {
    flexShrink: 1,
    minWidth: 0,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.space12,
    paddingHorizontal: theme.space16,
    paddingVertical: theme.space12,
  },
  rowBody: {
    flex: 1,
    gap: 3,
    minWidth: 0,
  },
  rowTop: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.space8,
    justifyContent: 'space-between',
  },
  separator: {
    backgroundColor: theme.color.border.dark,
    height: StyleSheet.hairlineWidth,
    marginLeft: theme.space16 + AVATAR_SIZE + theme.space12,
  },
  skeletonCategory: {
    height: 11,
    width: 80,
  },
  skeletonMeta: {
    height: 11,
    width: 72,
  },
  skeletonName: {
    height: 13,
    width: 100,
  },
  skeletonTitle: {
    height: 13,
    width: '80%',
  },
  stateContainer: {
    alignItems: 'center',
    backgroundColor: theme.color.background.dark,
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: theme.space20,
  },
  streamerName: {
    color: theme.color.text.dark,
  },
  thumbnail: {
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius8,
    height: THUMBNAIL_H,
    width: THUMBNAIL_W,
  },
  thumbnailContainer: {
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius8,
    flexShrink: 0,
    height: THUMBNAIL_H,
    overflow: 'hidden',
    width: THUMBNAIL_W,
  },
  thumbnailSkeleton: {
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius8,
    flexShrink: 0,
    height: THUMBNAIL_H,
    width: THUMBNAIL_W,
  },
  title: {
    color: theme.color.text.dark,
  },
});
