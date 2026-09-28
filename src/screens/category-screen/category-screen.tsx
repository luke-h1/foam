import { FC, memo, useCallback, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { Stack } from 'expo-router';

import {
  FlashList,
  FlashListRef,
  ListRenderItem,
} from '@app/components/flash-list/flash-list';
import { IconButton } from '@app/components/icon-button/icon-button';
import { MemoizedLiveStreamCard } from '@app/components/live-stream-card/live-stream-card';
import { LoadingState } from '@app/components/loading-state/loading-state';
import { ScreenHeader } from '@app/components/screen-header/screen-header';
import { EmptyState } from '@app/components/ui/empty-state/empty-state';
import { Text } from '@app/components/ui/text/text';
import { useFlattenedInfiniteQuery } from '@app/hooks/use-flattened-infinite-query';
import { useInfiniteQueryLoadMore } from '@app/hooks/use-infinite-query-load-more';
import { useScrollToTop } from '@app/hooks/use-scroll-to-top';
import {
  categoryQueryOptions,
  streamsByCategoryInfiniteQueryOptions,
} from '@app/lib/react-query/queries/twitch';
import { theme } from '@app/styles/themes';
import type { Category } from '@app/types/twitch/category';
import type { TwitchStream } from '@app/types/twitch/stream';
import { shareDeepLink } from '@app/utils/sharing/share-deep-link';
import { formatViewCount } from '@app/utils/string/format-view-count';

const renderCategoryStreamItem: ListRenderItem<TwitchStream> = ({ item }) => (
  <MemoizedLiveStreamCard stream={item} />
);

interface CategoryStreamsHeaderProps {
  category: Category;
  totalViewers: number;
}

const CategoryStreamsHeader = memo(function CategoryStreamsHeader({
  category,
  totalViewers,
}: CategoryStreamsHeaderProps) {
  return (
    <ScreenHeader
      size='hero'
      title={category.name}
      subtitle={`${formatViewCount(totalViewers)} viewers`}
      subtitleTestID='category-viewer-count'
      backgroundImage={category.box_art_url
        .replace('{width}', '600')
        .replace('{height}', '800')}
      featuredImage={category.box_art_url
        .replace('{width}', '300')
        .replace('{height}', '400')}
      back={false}
      safeArea={false}
    >
      <View style={styles.sectionHeader}>
        <Text type='sm' weight='semibold' color='gray.textLow'>
          Live Channels
        </Text>
      </View>
    </ScreenHeader>
  );
});

interface CategoryScreenProps {
  id: string;
}

export const CategoryScreen: FC<CategoryScreenProps> = ({ id }) => {
  const flashListRef = useRef<FlashListRef<TwitchStream>>(null);

  useScrollToTop(flashListRef);

  const {
    data: category,
    isLoading: isCategoryLoading,
    isError: isCategoryError,
  } = useQuery(categoryQueryOptions(id));

  const {
    data: streams,
    fetchNextPage,
    refetch,
    hasNextPage,
    isLoading: isLoadingStreams,
    isError: isErrorStreams,
    isFetchingNextPage,
  } = useInfiniteQuery(streamsByCategoryInfiniteQueryOptions(id));

  const handleLoadMore = useInfiniteQueryLoadMore({
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  });

  const allStreams = useFlattenedInfiniteQuery(streams?.pages);

  const totalViewers = useMemo(
    () => allStreams.reduce((acc, stream) => acc + stream.viewer_count, 0),
    [allStreams],
  );

  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await refetch().finally(() => setIsRefreshing(false));
  }, [refetch]);

  const handleShare = useCallback(() => {
    if (!category) {
      return;
    }

    void shareDeepLink({
      kind: 'category',
      id: category.id,
      name: category.name,
    });
  }, [category]);

  const headerRight = useCallback(
    () => (
      <IconButton
        icon={{ type: 'symbol', name: 'square.and.arrow.up', size: 18 }}
        label={`Share ${category?.name}`}
        onPress={handleShare}
        size='2xl'
      />
    ),
    [category?.name, handleShare],
  );

  if (isCategoryLoading || isLoadingStreams) {
    return <LoadingState />;
  }

  if (isCategoryError || isErrorStreams) {
    return (
      <EmptyState
        iconName='exclamationmark.triangle'
        content='Check your connection and try again'
        heading="Couldn't load this category"
        button='retry'
        buttonOnPress={() => void refetch()}
      />
    );
  }

  if (!streams) {
    return <LoadingState />;
  }

  if (allStreams.length === 0 || !category) {
    return (
      <EmptyState
        iconName='moon.zzz'
        heading='Nobody is live'
        content={`No one is streaming ${category?.name} right now. Refresh or check back later.`}
        button='Refresh'
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        buttonOnPress={handleRefresh}
      />
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          ...(process.env.EXPO_OS === 'android' && { title: category.name }),
          headerRight,
        }}
      />
      <FlashList<TwitchStream>
        ref={flashListRef}
        data={allStreams}
        keyExtractor={item => item.id}
        renderItem={renderCategoryStreamItem}
        drawDistance={500}
        getItemType={() => 'category-stream'}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <CategoryStreamsHeader
            category={category}
            totalViewers={totalViewers}
          />
        }
        onEndReachedThreshold={0.3}
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        onEndReached={handleLoadMore}
        refreshing={isRefreshing}
        onRefresh={handleRefresh}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.color.background.dark,
    flex: 1,
  },
  listContent: {
    paddingBottom: theme.space20,
  },
  sectionHeader: {
    borderBottomColor: theme.color.border.dark,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: theme.space16,
    paddingVertical: theme.space12,
  },
});
