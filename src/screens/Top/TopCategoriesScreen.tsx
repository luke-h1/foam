import { type RefObject, useCallback, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SharedValue, useAnimatedScrollHandler } from 'react-native-reanimated';

import { useObservable, useSelector } from '@legendapp/state/react';
import type { ListRenderItem } from '@shopify/flash-list';

import {
  CATEGORY_CARD_HEIGHT,
  MemoizedCategoryCard,
} from '@app/components/CategoryCard/CategoryCard';
import { AnimatedFlashList } from '@app/components/FlashList/AnimatedFlashList';
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

interface TopCategoriesScreenProps {
  contentTopInset?: number;
  scrollY?: SharedValue<number>;
}

export function TopCategoriesScreen({
  contentTopInset = 0,
  scrollY,
}: TopCategoriesScreenProps = {}) {
  const { t } = useTranslation('stream');
  const refreshing$ = useObservable(false);
  const refreshing = useSelector(refreshing$);
  const listRef = useRef<FlashListRef<Category>>(null);

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
          contentContainerStyle={[
            styles.listContent,
            { paddingTop: contentTopInset },
          ]}
        />
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.wrapper}>
        <EmptyState
          heading={t('failedToFetchCategories')}
          content={t('failedToFetchTopCategories')}
        />
      </View>
    );
  }

  if (allCategories.length === 0) {
    return (
      <View style={styles.wrapper}>
        <EmptyState
          content={t('noCategoriesFound')}
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
      refreshing={refreshing}
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
  refreshing,
  renderTopCategoryItem,
  scrollHandler,
}: {
  allCategories: Category[];
  contentTopInset: number;
  listRef: RefObject<FlashListRef<Category> | null>;
  onEndReached: () => void;
  onRefresh: () => void;
  refreshing: boolean;
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
