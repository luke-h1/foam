import { type RefObject, useCallback, useRef } from 'react';
import { StyleSheet, View } from 'react-native';

import { useObservable, useSelector } from '@legendapp/state/react';
import type { ListRenderItem } from '@shopify/flash-list';

import {
  CATEGORY_CARD_HEIGHT,
  MemoizedCategoryCard,
} from '@app/components/CategoryCard/CategoryCard';
import { FlashList, FlashListRef } from '@app/components/FlashList/FlashList';
import { EmptyState } from '@app/components/ui/EmptyState/EmptyState';
import { Skeleton } from '@app/components/ui/Skeleton/Skeleton';
import { useTopCategoriesQuery } from '@app/hooks/queries/useTopCategoriesQuery';
import { useFlattenedInfiniteQuery } from '@app/hooks/useFlattenedInfiniteQuery';
import { useInfiniteQueryLoadMore } from '@app/hooks/useInfiniteQueryLoadMore';
import { useRefetchOnForeground } from '@app/hooks/useRefetchOnForeground';
import { useScrollToTop } from '@app/hooks/useScrollToTop';
import { theme } from '@app/styles/themes';
import type { Category } from '@app/types/twitch/category';

const SKELETON_COUNT = 9;
const SKELETON_DATA = Array.from({ length: SKELETON_COUNT });
const SKELETON_COLUMNS = 3;
const TOP_CATEGORY_SKELETON_KEY_PREFIX = 'skeleton-';

function CategoryCardSkeleton() {
  return (
    <View style={styles.cardContainer} testID='category-skeleton'>
      <Skeleton style={styles.skeletonImage} />
      <Skeleton style={styles.skeletonTitle} />
    </View>
  );
}

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
  } = useTopCategoriesQuery();

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

  if (isError) {
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
      listRef={listRef}
      onEndReached={handleLoadMore}
      onRefresh={onRefresh}
      refreshing={refreshing}
      renderTopCategoryItem={renderTopCategoryItem}
    />
  );
}

function TopCategoriesList({
  allCategories,
  listRef,
  onEndReached,
  onRefresh,
  refreshing,
  renderTopCategoryItem,
}: {
  allCategories: Category[];
  listRef: RefObject<FlashListRef<Category> | null>;
  onEndReached: () => void;
  onRefresh: () => void;
  refreshing: boolean;
  renderTopCategoryItem: ListRenderItem<Category>;
}) {
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
  cardContainer: {
    flex: 1,
    marginHorizontal: 5,
    minHeight: CATEGORY_CARD_HEIGHT,
  },
  listContent: {
    paddingBottom: theme.space20,
  },
  skeletonImage: {
    alignSelf: 'center',
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius8,
    height: 150,
    marginBottom: 8,
    width: 110,
  },
  skeletonTitle: {
    alignSelf: 'center',
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius4,
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
