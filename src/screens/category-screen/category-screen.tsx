import { FC, memo, useCallback, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { Stack } from 'expo-router';

import {
  FlashList,
  FlashListRef,
  ListRenderItem,
} from '@app/components/flash-list/flash-list';
import { IconButton } from '@app/components/icon-button/icon-button';
import { Image } from '@app/components/image/image';
import { MemoizedLiveStreamCard } from '@app/components/live-stream-card/live-stream-card';
import { LiveStreamCardSkeleton } from '@app/components/live-stream-card/live-stream-card-skeleton';
import { SectionHeader } from '@app/components/section-header/section-header';
import { EmptyState } from '@app/components/ui/empty-state/empty-state';
import { Skeleton } from '@app/components/ui/skeleton/skeleton';
import { Text } from '@app/components/ui/text/text';
import { useFlattenedInfiniteQuery } from '@app/hooks/use-flattened-infinite-query';
import { useInfiniteQueryLoadMore } from '@app/hooks/use-infinite-query-load-more';
import { useScrollToTop } from '@app/hooks/use-scroll-to-top';
import {
  categoryQueryOptions,
  streamsByCategoryInfiniteQueryOptions,
} from '@app/lib/react-query/queries/twitch';
import { usePreference } from '@app/store/preference-store';
import { theme } from '@app/styles/themes';
import type { Category } from '@app/types/twitch/category';
import type { TwitchStream } from '@app/types/twitch/stream';
import { shareDeepLink } from '@app/utils/sharing/share-deep-link';
import { formatViewCount } from '@app/utils/string/format-view-count';

interface CategoryStreamsHeaderProps {
  category: Category;
  totalViewers: number;
}

const CategoryStreamsHeader = memo(function CategoryStreamsHeader({
  category,
  totalViewers,
}: CategoryStreamsHeaderProps) {
  return (
    <View>
      <View style={styles.hero}>
        <Image
          source={category.box_art_url
            .replace('{width}', '252')
            .replace('{height}', '336')}
          style={styles.boxArt}
          containerStyle={styles.boxArt}
        />
        <View style={styles.heroText}>
          <Text type='title1' numberOfLines={3}>
            {category.name}
          </Text>
          <Text
            type='subhead'
            color='gray.textLow'
            tabular
            testID='category-viewer-count'
          >
            {`${formatViewCount(totalViewers)} watching`}
          </Text>
        </View>
      </View>
      <SectionHeader title='Live channels' />
    </View>
  );
});

function CategorySkeleton({ layout }: { layout: 'compact' | 'media' }) {
  return (
    <ScrollView
      contentInsetAdjustmentBehavior='automatic'
      scrollEnabled={false}
      style={styles.container}
    >
      <View style={styles.hero}>
        <Skeleton style={styles.boxArt} />
        <View style={styles.heroText}>
          <Skeleton style={styles.titleSkeleton} />
          <Skeleton style={styles.metaSkeleton} />
        </View>
      </View>
      <View style={styles.skeletonGap} />
      <LiveStreamCardSkeleton layout={layout} />
      <LiveStreamCardSkeleton layout={layout} />
      <LiveStreamCardSkeleton layout={layout} />
      <LiveStreamCardSkeleton layout={layout} />
    </ScrollView>
  );
}

interface CategoryScreenProps {
  id: string;
}

export const CategoryScreen: FC<CategoryScreenProps> = ({ id }) => {
  const flashListRef = useRef<FlashListRef<TwitchStream>>(null);
  const streamListLayout = usePreference('streamListLayout');

  useScrollToTop(flashListRef);

  const {
    data: category,
    isLoading: isCategoryLoading,
    isError: isCategoryError,
    refetch: refetchCategory,
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

  const handleRetry = useCallback(() => {
    void refetchCategory();
    void refetch();
  }, [refetch, refetchCategory]);

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

  const renderItem: ListRenderItem<TwitchStream> = useCallback(
    ({ item }) => (
      <MemoizedLiveStreamCard
        stream={item}
        layout={streamListLayout}
        showCategory={false}
      />
    ),
    [streamListLayout],
  );

  if (isCategoryLoading || isLoadingStreams || (!streams && !isErrorStreams)) {
    return <CategorySkeleton layout={streamListLayout} />;
  }

  if (isCategoryError || isErrorStreams) {
    return (
      <EmptyState
        iconName='exclamationmark.triangle'
        heading="Couldn't load this category"
        content='Check your connection and try again.'
        button='Try again'
        buttonOnPress={handleRetry}
      />
    );
  }

  if (!category) {
    return (
      <EmptyState
        iconName='square.grid.2x2'
        heading='Category not found'
        content='This category may have been renamed or removed.'
      />
    );
  }

  if (allStreams.length === 0) {
    return (
      <EmptyState
        iconName='moon.zzz'
        heading='Nobody is live'
        content={`No one is streaming ${category.name} right now.`}
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
        renderItem={renderItem}
        drawDistance={500}
        getItemType={() => 'category-stream'}
        contentInsetAdjustmentBehavior='automatic'
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
  hero: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: theme.space16,
    paddingHorizontal: theme.space16,
    paddingTop: theme.space8,
  },
  boxArt: {
    aspectRatio: 3 / 4,
    borderCurve: 'continuous',
    borderRadius: theme.radius.md,
    overflow: 'hidden',
    width: 84,
  },
  heroText: {
    flex: 1,
    gap: theme.space4,
    minWidth: 0,
  },
  titleSkeleton: {
    height: 24,
    width: '70%',
  },
  metaSkeleton: {
    height: 12,
    width: 96,
  },
  skeletonGap: {
    height: theme.space24,
  },
});
