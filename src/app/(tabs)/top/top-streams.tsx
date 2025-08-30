import { EmptyState, LiveStreamCard, FlashList } from '@app/components';
import { LiveStreamCardSkeleton } from '@app/components/LiveStreamCard/LiveStreamCardSkeleton';
import { useDebouncedCallback } from '@app/hooks';
import { Stream, twitchService } from '@app/services';
import { getNextPageParam, getPreviousPageParam } from '@app/utils';
import { ListRenderItem } from '@shopify/flash-list';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useState, useRef, useCallback } from 'react';
import { RefreshControl } from 'react-native';

// Enhanced Stream type with profile picture with T generic variant
interface StreamWithProfile extends Stream {
  profilePicture?: string;
}

export default function TopStreamsScreen() {
  const [cursor, setCursor] = useState<string>('');
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const flashListRef = useRef<FlashList<StreamWithProfile>>(null);

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
    queryFn: ({ pageParam }) => twitchService.getTopStreams(pageParam),
    queryKey: ['TopStreams'],
  });

  const handleLoadMore = useCallback(async () => {
    if (hasNextPage && !isFetchingNextPage) {
      const nextCursor =
        streams?.pages[streams.pages.length - 1]?.pagination.cursor;
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

  const renderItem: ListRenderItem<Stream> = useCallback(({ item }) => {
    return <LiveStreamCard stream={item} />;
  }, []);

  // Show loading while auth context is not ready or while loading data
  if (refreshing || isLoading) {
    return (
      <>
        {Array.from({ length: 5 }).map((_, index) => (
          // eslint-disable-next-line react/no-array-index-key
          <LiveStreamCardSkeleton key={index} />
        ))}
      </>
    );
  }

  const allStreams = streams?.pages.flatMap(page => page.data) ?? [];

  if (allStreams.length === 0) {
    return (
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      <EmptyState content="No Top Streams found" buttonOnPress={onRefresh} />
    );
  }

  return (
    <FlashList<StreamWithProfile>
      ref={flashListRef}
      style={{ flex: 1 }}
      data={allStreams}
      renderItem={renderItem}
      keyExtractor={item => `${item.game_id}-${item.title}`}
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      onEndReached={debouncedHandleLoadMore}
      refreshing={refreshing}
      onEndReachedThreshold={0.3}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          // eslint-disable-next-line @typescript-eslint/no-misused-promises
          onRefresh={onRefresh}
          tintColor="white"
          colors={['white']}
        />
      }
    />
  );
}
