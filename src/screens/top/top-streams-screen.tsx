import { useCallback, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import type { ListRenderItem } from '@shopify/flash-list';
import { useInfiniteQuery } from '@tanstack/react-query';

import { FlashList, FlashListRef } from '@app/components/flash-list/flash-list';
import { MemoizedLiveStreamCard } from '@app/components/live-stream-card/live-stream-card';
import { LiveStreamCardSkeleton } from '@app/components/live-stream-card/live-stream-card-skeleton';
import { EmptyState } from '@app/components/ui/empty-state/empty-state';
import { useStreamProfilePictures } from '@app/hooks/queries/use-stream-profile-pictures';
import { useDebouncedCallback } from '@app/hooks/use-debounced-callback';
import { useFlattenedInfiniteQuery } from '@app/hooks/use-flattened-infinite-query';
import { useInfiniteQueryLoadMore } from '@app/hooks/use-infinite-query-load-more';
import { useRefetchOnForeground } from '@app/hooks/use-refetch-on-foreground';
import { useScrollToTop } from '@app/hooks/use-scroll-to-top';
import { topStreamsInfiniteQueryOptions } from '@app/lib/react-query/queries/twitch';
import { markFirstScreenInteractive } from '@app/lib/startup-marks';
import { usePreference } from '@app/store/preference-store';
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
    isError,
    isFetching,
    isFetchingNextPage,
  } = useInfiniteQuery({
    ...topStreamsInfiniteQueryOptions(),
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

  if (isError && allStreams.length === 0) {
    return (
      <View style={styles.container}>
        <EmptyState
          iconName='exclamationmark.triangle'
          heading="Couldn't load top streams"
          content='Check your connection and try again.'
          button='Retry'
          // eslint-disable-next-line @typescript-eslint/no-misused-promises
          buttonOnPress={onRefresh}
        />
      </View>
    );
  }

  if (allStreams.length === 0) {
    return (
      <View style={styles.container}>
        <EmptyState
          iconName='tv'
          heading='No streams right now'
          content='Nobody is live on Twitch top streams. Refresh to try again.'
          button='Refresh'
          // eslint-disable-next-line @typescript-eslint/no-misused-promises
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
        onLoad={markFirstScreenInteractive}
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
