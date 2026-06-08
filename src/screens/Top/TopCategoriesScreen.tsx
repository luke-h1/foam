import {
  CATEGORY_CARD_HEIGHT,
  MemoizedCategoryCard,
} from '@app/components/CategoryCard/CategoryCard';
import { EmptyState } from '@app/components/ui/EmptyState/EmptyState';
import { AnimatedFlashList } from '@app/components/FlashList/AnimatedFlashList';
import { FlashList, FlashListRef } from '@app/components/FlashList/FlashList';
import { Skeleton } from '@app/components/ui/Skeleton/Skeleton';
import { useBottomTabOverflow } from '@app/components/TabBarBackground/useBottomTabOverflow';
import { useInfiniteQueryLoadMore } from '@app/hooks/useInfiniteQueryLoadMore';
import { useRefetchOnForeground } from '@app/hooks/useRefetchOnForeground';
import { useScrollToTop } from '@app/hooks/useScrollToTop';
import { Category, twitchService } from '@app/services/twitch-service';
import { theme } from '@app/styles/themes';
import { flattenInfiniteQueryPages } from '@app/utils/pagination/flattenInfiniteQueryPages';
import { useObservable, useSelector } from '@legendapp/state/react';
import type { ListRenderItem } from '@shopify/flash-list';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useRef, type RefObject, useCallback, useMemo } from 'react';
import { RefreshControl, View, StyleSheet } from 'react-native';
import { SharedValue, useAnimatedScrollHandler } from 'react-native-reanimated';

const SKELETON_COUNT = 9;
const SKELETON_COLUMNS = 3;
const TOP_CATEGORY_SKELETON_KEY_PREFIX = 'skeleton-';

function CategoryCardSkeleton() {
  return (
    <View style={styles.cardContainer}>
      <Skeleton style={styles.skeletonImage} />
      <Skeleton style={styles.skeletonTitle} />
    </View>
  );
}

interface TopCategoriesScreenProps {
  contentTopInset?: number;
  scrollY?: SharedValue<number>;
}

export function TopCategoriesScreen({
  contentTopInset = 0,
  scrollY,
}: TopCategoriesScreenProps = {}) {
  const refreshing$ = useObservable(false);
  const refreshing = useSelector(refreshing$);
  const listRef = useRef<FlashListRef<Category>>(null);
  const skeletonData = Array.from({ length: SKELETON_COUNT });
  const tabBarOverflow = useBottomTabOverflow();
  const listBottomInset = tabBarOverflow + theme.space20;

  useScrollToTop(listRef);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: event => {
      if (scrollY) {
        scrollY.set(event.contentOffset.y);
      }
    },
  });

  const {
    data: categories,
    fetchNextPage,
    refetch,
    hasNextPage,
    isLoading,
    isFetching,
    isError,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['TopCategories'],
    queryFn: ({ pageParam }: { pageParam?: string }) =>
      twitchService.getTopCategories(pageParam as string),
    initialPageParam: undefined,
    staleTime: 60_000,
    getNextPageParam: lastPage => lastPage?.pagination?.cursor,
    getPreviousPageParam: () => undefined,
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

  const onRefresh = useCallback(async () => {
    refreshing$.set(true);
    await refetch();
    refreshing$.set(false);
  }, [refetch, refreshing$]);

  const allCategories = flattenInfiniteQueryPages(categories?.pages);
  const showSkeleton =
    isLoading || refreshing || (isFetching && allCategories.length === 0);

  const skeletonListContentStyle = useMemo(
    () => ({
      paddingTop: contentTopInset,
    }),
    [contentTopInset],
  );
  const skeletonListContentInset = useMemo(
    () => ({
      bottom: listBottomInset,
    }),
    [listBottomInset],
  );

  if (showSkeleton) {
    return (
      <View style={styles.wrapper}>
        <FlashList
          getItemType={() => 'category-skeleton'}
          contentInset={skeletonListContentInset}
          contentInsetAdjustmentBehavior='automatic'
          data={skeletonData}
          keyExtractor={(_, idx) => `${TOP_CATEGORY_SKELETON_KEY_PREFIX}${idx}`}
          numColumns={SKELETON_COLUMNS}
          renderItem={renderTopCategorySkeletonItem}
          contentContainerStyle={skeletonListContentStyle}
          scrollIndicatorInsets={skeletonListContentInset}
        />
      </View>
    );
  }

  if (!showSkeleton && isError) {
    return (
      <View style={styles.wrapper}>
        <EmptyState
          heading='Failed to fetch categories'
          content='Failed to fetch top categories'
        />
      </View>
    );
  }

  if (allCategories.length === 0) {
    return (
      <View style={styles.wrapper}>
        <EmptyState
          content='No categories found'
          buttonOnPress={() => void onRefresh()}
        />
      </View>
    );
  }

  return (
    <TopCategoriesList
      allCategories={allCategories}
      contentTopInset={contentTopInset}
      listBottomInset={listBottomInset}
      listRef={listRef}
      onEndReached={handleLoadMore}
      onRefresh={onRefresh}
      refreshing={refreshing}
      renderTopCategoryItem={renderTopCategoryItem}
      scrollHandler={scrollHandler}
    />
  );
}

function TopCategoriesList({
  allCategories,
  contentTopInset,
  listBottomInset,
  listRef,
  onEndReached,
  onRefresh,
  refreshing,
  renderTopCategoryItem,
  scrollHandler,
}: {
  allCategories: Category[];
  contentTopInset: number;
  listBottomInset: number;
  listRef: RefObject<FlashListRef<Category> | null>;
  onEndReached: () => void;
  onRefresh: () => void;
  refreshing: boolean;
  renderTopCategoryItem: ListRenderItem<Category>;
  scrollHandler: ReturnType<typeof useAnimatedScrollHandler>;
}) {
  const listContentStyle = useMemo(
    () => ({
      paddingTop: contentTopInset,
    }),
    [contentTopInset],
  );
  const listContentInset = useMemo(
    () => ({
      bottom: listBottomInset,
    }),
    [listBottomInset],
  );
  const refreshControl = useMemo(
    () => (
      <RefreshControl
        refreshing={refreshing}
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        onRefresh={onRefresh}
        tintColor={theme.color.textSecondary.dark}
        progressViewOffset={contentTopInset}
      />
    ),
    [contentTopInset, onRefresh, refreshing],
  );

  return (
    <View style={styles.wrapper}>
      <AnimatedFlashList<Category>
        ref={listRef}
        data={allCategories}
        numColumns={3}
        contentInset={listContentInset}
        contentInsetAdjustmentBehavior='automatic'
        getItemType={() => 'category-card'}
        contentContainerStyle={listContentStyle}
        renderItem={renderTopCategoryItem}
        keyExtractor={item => item.id}
        scrollIndicatorInsets={listContentInset}
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        onEndReached={onEndReached}
        onEndReachedThreshold={0.4}
        onScroll={scrollHandler}
        refreshControl={refreshControl}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    flex: 1,
    marginHorizontal: 5,
    minHeight: CATEGORY_CARD_HEIGHT,
  },
  skeletonImage: {
    alignSelf: 'center',
    borderCurve: 'continuous',
    borderRadius: 8,
    height: 150,
    marginBottom: 8,
    width: 110,
  },
  skeletonTitle: {
    alignSelf: 'center',
    borderCurve: 'continuous',
    borderRadius: 4,
    height: 40,
    marginBottom: theme.space16,
    width: 80,
  },
  wrapper: {
    backgroundColor: theme.color.background.dark,
    flex: 1,
  },
});

const renderTopCategoryItem: ListRenderItem<Category> = ({ item }) => (
  <View style={styles.cardContainer}>
    <MemoizedCategoryCard category={item} />
  </View>
);

const renderTopCategorySkeletonItem: ListRenderItem<unknown> = () => (
  <CategoryCardSkeleton />
);
