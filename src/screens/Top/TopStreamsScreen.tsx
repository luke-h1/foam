import { EmptyState } from '@app/components/EmptyState/EmptyState';
import { FlashList } from '@app/components/FlashList/FlashList';
import { LiveStreamCard } from '@app/components/LiveStreamCard/LiveStreamCard';
import { LiveStreamCardSkeleton } from '@app/components/LiveStreamCard/LiveStreamCardSkeleton';
import { RefreshControl } from '@app/components/RefreshControl/RefreshControl';
import { useDebouncedCallback } from '@app/hooks/useDebouncedCallback';
import { twitchQueries } from '@app/queries/twitchQueries';
import { TwitchStream } from '@app/services/twitch-service';
import { theme } from '@app/styles/themes';
import {
  getNextPageParam,
  getPreviousPageParam,
} from '@app/utils/pagination/pagination';
import type { ListRenderItem } from '@shopify/flash-list';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useState, useRef, useCallback } from 'react';
import { Platform, View, StyleSheet } from 'react-native';

export function TopStreamsScreen() {
  const [cursor, setCursor] = useState<string>('');
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const flashListRef = useRef(null);

  const {
    data: streams,
    fetchNextPage,
    refetch,
    hasNextPage,
    isLoading,
    isFetchingNextPage,
  } = useInfiniteQuery({
    initialPageParam: cursor,
    getNextPageParam,
    getPreviousPageParam,
    ...twitchQueries.getTopStreamsInfinite(),
  });

  const handleLoadMore = useCallback(async () => {
    if (hasNextPage && !isFetchingNextPage) {
      const nextCursor =
        streams?.pages?.[streams.pages.length - 1]?.pagination?.cursor;
      setCursor(nextCursor as string);
      await fetchNextPage();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasNextPage, isFetchingNextPage]);

  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  const [debouncedHandleLoadMore] = useDebouncedCallback(handleLoadMore, 150);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const renderItem: ListRenderItem<TwitchStream> = useCallback(({ item }) => {
    return <LiveStreamCard stream={item} />;
  }, []);

  if (refreshing || isLoading) {
    return (
      <View style={styles.container}>
        {Array.from({ length: 5 }).map((_, index) => (
          // eslint-disable-next-line react/no-array-index-key
          <LiveStreamCardSkeleton key={index} />
        ))}
      </View>
    );
  }

  if (!streams || !streams.pages) {
    return (
      <View style={styles.container}>
        {/* eslint-disable-next-line @typescript-eslint/no-misused-promises */}
        <EmptyState content="No Top Streams found" buttonOnPress={onRefresh} />
      </View>
    );
  }

  const allStreams =
    streams.pages.flatMap(page => (page?.data ? page.data : [])) ?? [];

  if (allStreams.length === 0) {
    return (
      <View style={styles.container}>
        {/* eslint-disable-next-line @typescript-eslint/no-misused-promises */}
        <EmptyState content="No Top Streams found" buttonOnPress={onRefresh} />
      </View>
    );
  }

  const refreshControl =
    Platform.OS === 'android' ? undefined : (
      <RefreshControl onRefresh={onRefresh} />
    );

  return (
    <View style={styles.container}>
      <FlashList
        ref={flashListRef}
        contentInsetAdjustmentBehavior="automatic"
        data={allStreams}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        drawDistance={500}
        contentContainerStyle={styles.listContent}
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        onEndReached={debouncedHandleLoadMore}
        refreshing={refreshing}
        onEndReachedThreshold={0.3}
        refreshControl={refreshControl}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.gray.bg,
    flex: 1,
  },
  listContent: {
    paddingBottom: theme.spacing.lg,
  },
});
