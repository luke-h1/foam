import {
  CATEGORY_CARD_HEIGHT,
  MemoizedCategoryCard,
} from '@app/components/CategoryCard/CategoryCard';
import { EmptyState } from '@app/components/ui/EmptyState/EmptyState';
import { AnimatedFlashList } from '@app/components/FlashList/AnimatedFlashList';
import { FlashList, FlashListRef } from '@app/components/FlashList/FlashList';
import { Skeleton } from '@app/components/ui/Skeleton/Skeleton';
import { useInfiniteQueryLoadMore } from '@app/hooks/useInfiniteQueryLoadMore';
import { useRefetchOnForeground } from '@app/hooks/useRefetchOnForeground';
import { useScrollToTop } from '@app/hooks/useScrollToTop';
import { useTopCategoriesQuery } from '@app/hooks/queries/use-top-categories-query';
import { Category } from '@app/services/twitch-service';
import { theme } from '@app/styles/themes';
import { flattenInfiniteQueryPages } from '@app/utils/pagination/flattenInfiniteQueryPages';
import { useObservable, useSelector } from '@legendapp/state/react';
import type { ListRenderItem } from '@shopify/flash-list';
import { useRef, type RefObject, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { SharedValue, useAnimatedScrollHandler } from 'react-native-reanimated';

const SKELETON_COUNT = 9;
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

  const allCategories = flattenInfiniteQueryPages(categories?.pages);
  const showSkeleton =
    isLoading || refreshing || (isFetching && allCategories.length === 0);

  if (showSkeleton) {
    return (
      <View style={styles.wrapper}>
        <FlashList
          getItemType={() => 'category-skeleton'}
          contentInsetAdjustmentBehavior='automatic'
          data={skeletonData}
          keyExtractor={(_, idx) => `${TOP_CATEGORY_SKELETON_KEY_PREFIX}${idx}`}
          numColumns={SKELETON_COLUMNS}
          renderItem={renderTopCategorySkeletonItem}
          contentContainerStyle={[
            styles.listContent,
            { paddingTop: contentTopInset },
          ]}
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
      listRef={listRef}
      onEndReached={handleLoadMore}
      onRefresh={onRefresh}
      renderTopCategoryItem={renderTopCategoryItem}
      scrollHandler={scrollHandler}
    />
  );
}

function TopCategoriesList({
  allCategories,
  contentTopInset,
  listRef,
  onEndReached,
  onRefresh,
  renderTopCategoryItem,
  scrollHandler,
}: {
  allCategories: Category[];
  contentTopInset: number;
  listRef: RefObject<FlashListRef<Category> | null>;
  onEndReached: () => void;
  onRefresh: () => void;
  renderTopCategoryItem: ListRenderItem<Category>;
  scrollHandler: ReturnType<typeof useAnimatedScrollHandler>;
}) {
  return (
    <View style={styles.wrapper} testID='top-categories-list'>
      <AnimatedFlashList<Category>
        ref={listRef}
        data={allCategories}
        numColumns={3}
        contentInsetAdjustmentBehavior='automatic'
        getItemType={() => 'category-card'}
        contentContainerStyle={[
          styles.listContent,
          { paddingTop: contentTopInset },
        ]}
        renderItem={renderTopCategoryItem}
        keyExtractor={item => item.id}
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        onEndReached={onEndReached}
        onEndReachedThreshold={0.4}
        onScroll={scrollHandler}
        onRefresh={onRefresh}
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
