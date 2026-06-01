import { Button } from '@app/components/Button/Button';
import { EmptyState } from '@app/components/ui/EmptyState/EmptyState';
import {
  AnimatedFlashList,
  FlashListRef,
} from '@app/components/FlashList/FlashList';
import { Image } from '@app/components/Image/Image';
import { MemoizedLiveStreamCard } from '@app/components/LiveStreamCard/LiveStreamCard';
import { LiveStreamCardSkeleton } from '@app/components/LiveStreamCard/LiveStreamCardSkeleton';
import { PressableArea } from '@app/components/PressableArea/PressableArea';
import { RefreshControl } from '@app/components/RefreshControl/RefreshControl';
import { Text } from '@app/components/ui/Text/Text';
import { useDebouncedCallback } from '@app/hooks/useDebouncedCallback';
import { useInfiniteQueryLoadMore } from '@app/hooks/useInfiniteQueryLoadMore';
import { useRefetchOnForeground } from '@app/hooks/useRefetchOnForeground';
import { useScrollToTop } from '@app/hooks/useScrollToTop';
import { twitchQueries } from '@app/queries/twitchQueries';
import { TwitchStream } from '@app/services/twitch-service';
import {
  type Preferences,
  usePreference,
  useUpdatePreferences,
} from '@app/store/preferenceStore';
import { theme } from '@app/styles/themes';
import {
  getNextPageParam,
  getPreviousPageParam,
} from '@app/utils/pagination/pagination';
import { flattenInfiniteQueryPages } from '@app/utils/pagination/flattenInfiniteQueryPages';
import { elapsedStreamTime } from '@app/utils/string/elapsedStreamTime';
import { formatViewCount } from '@app/utils/string/formatViewCount';
import type { ListRenderItem } from '@shopify/flash-list';
import { useInfiniteQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { LinearGradient } from 'expo-linear-gradient';
import { memo, useCallback, useMemo, useRef, useState } from 'react';
import { Platform, View, StyleSheet } from 'react-native';
import { SharedValue, useAnimatedScrollHandler } from 'react-native-reanimated';

const FeaturedStreamHero = memo(function FeaturedStreamHero({
  stream,
}: {
  stream: TwitchStream;
}) {
  const thumbnailUrl = stream.thumbnail_url
    .replace('{width}', '1920')
    .replace('{height}', '1080');

  const handleStreamPress = useCallback(() => {
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

  return (
    <Button onPress={handleStreamPress} style={styles.heroWrapper}>
      <View style={styles.heroCard}>
        <Image
          source={thumbnailUrl}
          style={styles.heroImage}
          containerStyle={styles.heroImageContainer}
          transition={150}
        />
        <LinearGradient
          colors={['rgba(0,0,0,0.06)', 'rgba(0,0,0,0.28)', 'rgba(0,0,0,0.92)']}
          locations={[0, 0.45, 1]}
          style={styles.heroGradient}
        />

        <View style={styles.heroTopRow}>
          <View style={styles.heroLivePill}>
            <View style={styles.heroLiveDot} />
            <Text type='xxs' weight='bold' style={styles.heroLiveText}>
              LIVE
            </Text>
          </View>

          <View style={styles.heroMetricPill}>
            <Text type='xxs' weight='semibold' style={styles.heroMetricText}>
              {formatViewCount(stream.viewer_count)} viewers
            </Text>
          </View>
        </View>

        <View style={styles.heroContent}>
          <Text type='xs' weight='semibold' style={styles.heroEyebrow}>
            Featured stream
          </Text>
          <Text
            type='2xl'
            weight='bold'
            numberOfLines={2}
            style={styles.heroTitle}
          >
            {stream.title}
          </Text>

          <View style={styles.heroMetaRow}>
            <PressableArea
              onPress={handleStreamerPress}
              onPressIn={handleStreamerPressIn}
              hitSlop={8}
            >
              <Text type='sm' weight='semibold' style={styles.heroMetaText}>
                {stream.user_name}
              </Text>
            </PressableArea>
            <Text type='sm' style={styles.heroMetaDivider}>
              •
            </Text>
            <Text type='sm' style={styles.heroMetaText}>
              {elapsedStreamTime(stream.started_at)}
            </Text>
          </View>

          <View style={styles.heroFooterRow}>
            <PressableArea
              onPress={handleCategoryPress}
              hitSlop={8}
              style={styles.heroCategoryBadge}
            >
              <Text
                type='xxs'
                weight='semibold'
                style={styles.heroCategoryText}
              >
                {stream.game_name}
              </Text>
            </PressableArea>

            <View style={styles.heroCta}>
              <Text type='xxs' weight='bold' style={styles.heroCtaText}>
                Watch now
              </Text>
            </View>
          </View>
        </View>
      </View>
    </Button>
  );
});

FeaturedStreamHero.displayName = 'FeaturedStreamHero';

type StreamListLayout = Preferences['streamListLayout'];

const STREAM_LIST_LAYOUT_OPTIONS: {
  icon: SymbolViewProps['name'];
  label: string;
  value: StreamListLayout;
}[] = [
  { icon: 'square', label: 'Compact', value: 'compact' },
  { icon: 'photo', label: 'Media', value: 'media' },
  { icon: 'text.alignleft', label: 'Text First', value: 'text' },
];

const StreamLayoutToggle = memo(function StreamLayoutToggle({
  value,
  onChange,
}: {
  value: StreamListLayout;
  onChange: (value: StreamListLayout) => void;
}) {
  return (
    <View style={styles.layoutToggleRow}>
      {STREAM_LIST_LAYOUT_OPTIONS.map(option => {
        const active = value === option.value;

        return (
          <Button
            key={option.value}
            onPress={() => onChange(option.value)}
            style={[
              styles.layoutToggleButton,
              active && styles.layoutToggleButtonActive,
            ]}
          >
            <SymbolView
              name={option.icon}
              size={14}
              tintColor={
                active ? theme.color.text.dark : theme.color.textSecondary.dark
              }
            />
            <Text
              type='xxs'
              weight='semibold'
              style={[
                styles.layoutToggleText,
                active && styles.layoutToggleTextActive,
              ]}
            >
              {option.label}
            </Text>
          </Button>
        );
      })}
    </View>
  );
});

StreamLayoutToggle.displayName = 'StreamLayoutToggle';

interface TopStreamsListHeaderProps {
  featuredStream?: TwitchStream;
  streamListLayout: StreamListLayout;
  onChangeLayout: (layout: StreamListLayout) => void;
}

const TopStreamsListHeader = memo(function TopStreamsListHeader({
  featuredStream,
  streamListLayout,
  onChangeLayout,
}: TopStreamsListHeaderProps) {
  return (
    <>
      {featuredStream ? <FeaturedStreamHero stream={featuredStream} /> : null}
      <StreamLayoutToggle value={streamListLayout} onChange={onChangeLayout} />
    </>
  );
});

TopStreamsListHeader.displayName = 'TopStreamsListHeader';

interface TopStreamsScreenProps {
  contentTopInset?: number;
  scrollY?: SharedValue<number>;
}

export function TopStreamsScreen({
  contentTopInset = 0,
  scrollY,
}: TopStreamsScreenProps = {}) {
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const streamListLayout = usePreference('streamListLayout');
  const updatePreferences = useUpdatePreferences();
  const listRef = useRef<FlashListRef<TwitchStream>>(null);

  useScrollToTop(listRef);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: event => {
      if (scrollY) {
        scrollY.value = event.contentOffset.y;
      }
    },
  });

  const {
    data: streams,
    fetchNextPage,
    refetch,
    hasNextPage,
    isLoading,
    isFetchingNextPage,
  } = useInfiniteQuery({
    initialPageParam: undefined,
    getNextPageParam,
    getPreviousPageParam,
    ...twitchQueries.getTopStreamsInfinite(),
    refetchOnWindowFocus: true,
  });

  useRefetchOnForeground({
    refetch,
  });

  const handleLoadMore = useInfiniteQueryLoadMore({
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  });

  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  const [debouncedHandleLoadMore] = useDebouncedCallback(handleLoadMore, 150);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const renderItem: ListRenderItem<TwitchStream> = useCallback(
    ({ item }) => {
      return <MemoizedLiveStreamCard stream={item} layout={streamListLayout} />;
    },
    [streamListLayout],
  );

  const allStreams = useMemo(
    () => flattenInfiniteQueryPages(streams?.pages),
    [streams],
  );
  const featuredStream = allStreams[0];
  const remainingStreams = useMemo(() => allStreams.slice(1), [allStreams]);

  const handleLayoutChange = useCallback(
    (layout: StreamListLayout) => {
      updatePreferences({ streamListLayout: layout });
    },
    [updatePreferences],
  );

  const listHeader = useMemo(
    () => (
      <TopStreamsListHeader
        featuredStream={featuredStream}
        streamListLayout={streamListLayout}
        onChangeLayout={handleLayoutChange}
      />
    ),
    [featuredStream, streamListLayout, handleLayoutChange],
  );

  if (refreshing || isLoading) {
    return (
      <View style={[styles.container, { paddingTop: contentTopInset }]}>
        {Array.from({ length: 5 }).map((_, index) => (
          // eslint-disable-next-line react/no-array-index-key
          <LiveStreamCardSkeleton key={index} layout={streamListLayout} />
        ))}
      </View>
    );
  }

  if (!streams || !streams.pages) {
    return (
      <View style={styles.container}>
        {/* eslint-disable-next-line @typescript-eslint/no-misused-promises */}
        <EmptyState content='No Top Streams found' buttonOnPress={onRefresh} />
      </View>
    );
  }

  if (allStreams.length === 0) {
    return (
      <View style={styles.container}>
        {/* eslint-disable-next-line @typescript-eslint/no-misused-promises */}
        <EmptyState content='No Top Streams found' buttonOnPress={onRefresh} />
      </View>
    );
  }

  const refreshControl =
    Platform.OS === 'android' ? undefined : (
      <RefreshControl onRefresh={onRefresh} />
    );

  return (
    <View style={styles.container}>
      <AnimatedFlashList
        ref={listRef}
        contentInsetAdjustmentBehavior='automatic'
        data={remainingStreams}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        removeClippedSubviews
        getItemType={() => 'stream-item'}
        drawDistance={500}
        contentContainerStyle={[
          styles.listContent,
          { paddingTop: contentTopInset },
        ]}
        ListHeaderComponent={listHeader}
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        onEndReached={debouncedHandleLoadMore}
        onScroll={scrollHandler}
        refreshing={refreshing}
        onEndReachedThreshold={0.3}
        refreshControl={refreshControl}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.color.background.dark,
    flex: 1,
  },
  listContent: {
    paddingBottom: theme.space20,
  },
  layoutToggleButton: {
    alignItems: 'center',
    backgroundColor: theme.color.background.darkAlt,
    borderColor: theme.colorBorderSecondary,
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  layoutToggleButtonActive: {
    backgroundColor: theme.darkActiveContent,
    borderColor: theme.color.border.dark,
  },
  layoutToggleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.space8,
    marginBottom: theme.space20,
    marginHorizontal: theme.space20,
  },
  layoutToggleText: {
    color: theme.color.textSecondary.dark,
  },
  layoutToggleTextActive: {
    color: theme.color.text.dark,
  },
  heroCard: {
    borderColor: theme.colorBorderSecondary,
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius28,
    borderWidth: 1,
    minHeight: 420,
    overflow: 'hidden',
    position: 'relative',
  },
  heroCategoryBadge: {
    backgroundColor: 'rgba(15, 23, 42, 0.58)',
    borderColor: 'rgba(255, 255, 255, 0.14)',
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  heroCategoryText: {
    color: theme.color.text.dark,
  },
  heroContent: {
    bottom: 0,
    gap: theme.space12,
    left: 0,
    padding: theme.space20,
    position: 'absolute',
    right: 0,
  },
  heroCta: {
    backgroundColor: theme.color.text.dark,
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius999,
    marginLeft: 'auto',
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  heroCtaText: {
    color: theme.color.background.dark,
  },
  heroEyebrow: {
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  heroFooterRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.space12,
    marginTop: theme.space8,
  },
  heroGradient: {
    ...StyleSheet.absoluteFill,
  },
  heroImage: {
    height: 420,
    width: '100%',
  },
  heroImageContainer: {
    height: 420,
    width: '100%',
  },
  heroLiveDot: {
    backgroundColor: '#ff4444',
    borderRadius: 4,
    height: 8,
    width: 8,
  },
  heroLivePill: {
    alignItems: 'center',
    backgroundColor: 'rgba(8, 8, 10, 0.72)',
    borderColor: 'rgba(255, 255, 255, 0.14)',
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  heroLiveText: {
    color: theme.color.text.dark,
  },
  heroMetaDivider: {
    color: 'rgba(255,255,255,0.55)',
  },
  heroMetaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  heroMetaText: {
    color: 'rgba(255,255,255,0.82)',
  },
  heroMetricPill: {
    backgroundColor: 'rgba(8, 8, 10, 0.56)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  heroMetricText: {
    color: theme.color.text.dark,
  },
  heroTitle: {
    color: theme.color.text.dark,
    lineHeight: 34,
    maxWidth: '92%',
  },
  heroTopRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    left: theme.space20,
    position: 'absolute',
    right: theme.space20,
    top: theme.space20,
    zIndex: 1,
  },
  heroWrapper: {
    marginBottom: theme.space20,
    marginHorizontal: theme.space16,
  },
});
