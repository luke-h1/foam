import LiveStreamCard from '@app/components/LiveStreamCard';
import ScrollToTop from '@app/components/ScrollToTop';
import EmptyState from '@app/components/ui/EmptyState';
import Screen from '@app/components/ui/Screen';
import Spinner from '@app/components/ui/Spinner';
import twitchService, { Stream } from '@app/services/twitchService';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useState, useRef } from 'react';
import {
  FlatList,
  RefreshControl,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';

export default function TopStreamsScreen() {
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
    return <Spinner />;
  }

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const allStreams = streams?.pages.flatMap(page => page.data) ?? [];

  if (allStreams.length === 0) {
    return (
      <EmptyState content="No Top Streams found" buttonOnPress={onRefresh} />
    );
  }

  const handleLoadMore = async () => {
    if (hasNextPage) {
      setPreviousCursor(cursor);
      const nextCursor =
        streams?.pages[streams.pages.length - 1].pagination.cursor;
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
        onEndReached={handleLoadMore}
        onEndReachedThreshold={1.5}
        refreshing={refreshing}
        onScroll={handleScroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
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
