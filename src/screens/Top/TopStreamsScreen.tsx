import { useCallback, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import type { ListRenderItem } from '@shopify/flash-list';

import { FlashList, FlashListRef } from '@app/components/FlashList/FlashList';
import { MemoizedLiveStreamCard } from '@app/components/LiveStreamCard/LiveStreamCard';
import { LiveStreamCardSkeleton } from '@app/components/LiveStreamCard/LiveStreamCardSkeleton';
import { EmptyState } from '@app/components/ui/EmptyState/EmptyState';
import { useStreamProfilePictures } from '@app/hooks/queries/useStreamProfilePictures';
import { useTopStreamsQuery } from '@app/hooks/queries/useTopStreamsQuery';
import { useDebouncedCallback } from '@app/hooks/useDebouncedCallback';
import { useFlattenedInfiniteQuery } from '@app/hooks/useFlattenedInfiniteQuery';
import { useInfiniteQueryLoadMore } from '@app/hooks/useInfiniteQueryLoadMore';
import { useRefetchOnForeground } from '@app/hooks/useRefetchOnForeground';
import { useScrollToTop } from '@app/hooks/useScrollToTop';
import { usePreference } from '@app/store/preferenceStore';
import { theme } from '@app/styles/themes';
import type { TwitchStream } from '@app/types/twitch/stream';

export function TopStreamsScreen() {
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const streamListLayout = usePreference('streamListLayout');
  const listRef = useRef<FlashListRef<TwitchStream>>(null);

  useScrollToTop(listRef);

  const {
    data: streams,
    fetchNextPage,
    refetch,
    hasNextPage,
    isLoading,
    isFetching,
    isFetchingNextPage,
  } = useTopStreamsQuery();

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
    await refetch().finally(() => setRefreshing(false));
  }, [refetch]);

  const renderItem: ListRenderItem<TwitchStream> = useCallback(
    ({ item }) => (
      <MemoizedLiveStreamCard stream={item} layout={streamListLayout} />
    ),
    [streamListLayout],
  );

  const flattenedStreams = useFlattenedInfiniteQuery(streams?.pages);
  const allStreams = useStreamProfilePictures(
    flattenedStreams,
    streamListLayout === 'media',
  );

  const showSkeleton = isLoading || (isFetching && allStreams.length === 0);

  if (showSkeleton) {
    return (
      <ScrollView
        accessibilityLabel='Loading streams'
        accessibilityRole='progressbar'
        contentInsetAdjustmentBehavior='automatic'
        scrollEnabled={false}
        style={styles.container}
      >
        <LiveStreamCardSkeleton layout={streamListLayout} />
        <LiveStreamCardSkeleton layout={streamListLayout} />
        <LiveStreamCardSkeleton layout={streamListLayout} />
        <LiveStreamCardSkeleton layout={streamListLayout} />
        <LiveStreamCardSkeleton layout={streamListLayout} />
      </ScrollView>
    );
  }

  if (allStreams.length === 0) {
    return (
      <View style={styles.container}>
        {/* eslint-disable-next-line @typescript-eslint/no-misused-promises */}
        <EmptyState
          heading='No live streams'
          content='Nothing is live right now. Refresh to check again.'
          buttonOnPress={onRefresh}
        />
      </View>
    );
  }

  return (
    <TopStreamsList
      debouncedHandleLoadMore={debouncedHandleLoadMore}
      listRef={listRef}
      onRefresh={onRefresh}
      refreshing={refreshing}
      remainingStreams={allStreams}
      renderItem={renderItem}
    />
  );
}

function TopStreamsList({
  debouncedHandleLoadMore,
  listRef,
  onRefresh,
  refreshing,
  remainingStreams,
  renderItem,
}: {
  debouncedHandleLoadMore: () => void;
  listRef: React.RefObject<FlashListRef<TwitchStream> | null>;
  onRefresh: () => void;
  refreshing: boolean;
  remainingStreams: TwitchStream[];
  renderItem: ListRenderItem<TwitchStream>;
}) {
  return (
    <View testID='top-streams-list' style={styles.container}>
      <FlashList
        ref={listRef}
        contentInsetAdjustmentBehavior='automatic'
        data={remainingStreams}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        getItemType={() => 'stream-item'}
        drawDistance={500}
        contentContainerStyle={styles.listContent}
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        onEndReached={debouncedHandleLoadMore}
        refreshing={refreshing}
        onEndReachedThreshold={0.3}
        onRefresh={onRefresh}
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
});
