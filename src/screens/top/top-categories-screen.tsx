import { type RefObject, useCallback, useRef } from 'react';
import { StyleSheet, View } from 'react-native';

import { useObservable, useSelector } from '@legendapp/state/react';
import type { ListRenderItem } from '@shopify/flash-list';
import { useInfiniteQuery } from '@tanstack/react-query';

import { MemoizedCategoryCard } from '@app/components/category-card/category-card';
import { CategoryCardSkeleton } from '@app/components/category-card/category-card-skeleton';
import { FlashList, FlashListRef } from '@app/components/flash-list/flash-list';
import { EmptyState } from '@app/components/ui/empty-state/empty-state';
import { useFlattenedInfiniteQuery } from '@app/hooks/use-flattened-infinite-query';
import { useInfiniteQueryLoadMore } from '@app/hooks/use-infinite-query-load-more';
import { useRefetchOnForeground } from '@app/hooks/use-refetch-on-foreground';
import { useScrollToTop } from '@app/hooks/use-scroll-to-top';
import { topCategoriesInfiniteQueryOptions } from '@app/lib/react-query/queries/twitch';
import { theme } from '@app/styles/themes';
import type { Category } from '@app/types/twitch/category';

const SKELETON_COUNT = 9;
const SKELETON_DATA = Array.from({ length: SKELETON_COUNT });
const SKELETON_COLUMNS = 3;
const TOP_CATEGORY_SKELETON_KEY_PREFIX = 'skeleton-';

export function TopCategoriesScreen() {
  const refreshing$ = useObservable(false);
  const refreshing = useSelector(refreshing$);
  const listRef = useRef<FlashListRef<Category>>(null);

  useScrollToTop(listRef);

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
    ...topCategoriesInfiniteQueryOptions(),
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

  const allCategories = useFlattenedInfiniteQuery(categories?.pages);
  const showSkeleton = isLoading || (isFetching && allCategories.length === 0);

  if (showSkeleton) {
    return (
      <View style={styles.wrapper}>
        <FlashList
          getItemType={() => 'category-skeleton'}
          contentInsetAdjustmentBehavior='automatic'
          data={SKELETON_DATA}
          keyExtractor={(_, idx) => `${TOP_CATEGORY_SKELETON_KEY_PREFIX}${idx}`}
          numColumns={SKELETON_COLUMNS}
          renderItem={renderTopCategorySkeletonItem}
          contentContainerStyle={styles.listContent}
        />
      </View>
    );
  }

  if (isError && allCategories.length === 0) {
    return (
      <View style={styles.wrapper}>
        <EmptyState
          iconName='exclamationmark.triangle'
          heading="Couldn't load categories"
          content='Check your connection and try again.'
          button='Try again'
          buttonOnPress={() => void onRefresh()}
        />
      </View>
    );
  }

  if (allCategories.length === 0) {
    return (
      <View style={styles.wrapper}>
        <EmptyState
          iconName='square.grid.2x2'
          heading='No categories right now'
          content='Twitch returned no top categories. Refresh to try again.'
          button='Refresh'
          buttonOnPress={() => void onRefresh()}
        />
      </View>
    );
  }

  return (
    <TopCategoriesList
      allCategories={allCategories}
      listRef={listRef}
      onEndReached={handleLoadMore}
      onRefresh={onRefresh}
      refreshing={refreshing}
      renderTopCategoryItem={renderTopCategoryItem}
    />
  );
}

interface TopCategoriesListProps {
  allCategories: Category[];
  listRef: RefObject<FlashListRef<Category> | null>;
  onEndReached: () => void;
  onRefresh: () => void;
  refreshing: boolean;
  renderTopCategoryItem: ListRenderItem<Category>;
}

function TopCategoriesList({
  allCategories,
  listRef,
  onEndReached,
  onRefresh,
  refreshing,
  renderTopCategoryItem,
}: TopCategoriesListProps) {
  return (
    <View style={styles.wrapper} testID='top-categories-list'>
      <FlashList<Category>
        ref={listRef}
        data={allCategories}
        numColumns={3}
        contentInsetAdjustmentBehavior='automatic'
        getItemType={() => 'category-card'}
        contentContainerStyle={styles.listContent}
        renderItem={renderTopCategoryItem}
        keyExtractor={item => item.id}
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        onEndReached={onEndReached}
        onEndReachedThreshold={0.4}
        onRefresh={onRefresh}
        refreshing={refreshing}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingBottom: theme.space20,
    paddingHorizontal: 10,
    paddingTop: theme.space8,
  },
  wrapper: {
    backgroundColor: theme.color.background.dark,
    flex: 1,
  },
});

const renderTopCategoryItem: ListRenderItem<Category> = ({ item }) => (
  <MemoizedCategoryCard category={item} />
);

const renderTopCategorySkeletonItem: ListRenderItem<unknown> = () => (
  <CategoryCardSkeleton />
);
