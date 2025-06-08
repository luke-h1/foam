import {
  EmptyState,
  LiveStreamCard,
  Screen,
  ScrollToTop,
} from '@app/components';
import { LiveStreamCardSkeleton } from '@app/components/LiveStreamCard/LiveStreamCardSkeleton';
import { Stream, twitchService } from '@app/services';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useState, useRef } from 'react';
import {
  FlatList,
  RefreshControl,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';

export function TopStreamsScreen() {
  const [previousCursor, setPreviousCursor] = useState<string | undefined>(
    undefined,
  );
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [showScrollToTop, setShowScrollToTop] = useState<boolean>(false);
  const flatListRef = useRef<FlatList<Stream>>(null);

  const {
    data: streams,
    fetchNextPage,
    refetch,
    hasNextPage,
    isLoading,
  } = useInfiniteQuery({
    queryKey: ['TopStreams'],
    queryFn: ({ pageParam }: { pageParam?: string }) =>
      twitchService.getTopStreams(pageParam as string),
    initialPageParam: cursor,
    getNextPageParam: lastPage => lastPage.pagination.cursor,
    getPreviousPageParam: () => previousCursor,
  });

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

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const allStreams = streams?.pages.flatMap(page => page.data) ?? [];

  if (allStreams.length === 0) {
    return (
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      <EmptyState content="No Top Streams found" buttonOnPress={onRefresh} />
    );
  }

  const handleLoadMore = async () => {
    if (hasNextPage) {
      setPreviousCursor(cursor);
      const nextCursor =
        streams?.pages[streams.pages.length - 1]?.pagination.cursor;
      setCursor(nextCursor);
      await fetchNextPage();
    }
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    if (offsetY > 300) {
      setShowScrollToTop(true);
    } else {
      setShowScrollToTop(false);
    }
  };

  const scrollToTop = () => {
    flatListRef.current?.scrollToOffset({ animated: true, offset: 0 });
  };

  return (
    <Screen style={{ flex: 1 }}>
      <FlatList<Stream>
        ref={flatListRef}
        data={allStreams}
        renderItem={({ item }) => <LiveStreamCard stream={item} />}
        keyExtractor={item => item.id}
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        onEndReached={handleLoadMore}
        onEndReachedThreshold={1.5}
        refreshing={refreshing}
        onScroll={handleScroll}
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
      {showScrollToTop && <ScrollToTop onPress={scrollToTop} />}
    </Screen>
  );
}
