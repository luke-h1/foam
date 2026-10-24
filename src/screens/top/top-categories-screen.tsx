import { type RefObject, use, useCallback, useMemo, useRef } from 'react';
import {
  Platform,
  type StyleProp,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useObservable, useSelector } from '@legendapp/state/react';
import type { ListRenderItem } from '@shopify/flash-list';
import { useInfiniteQuery } from '@tanstack/react-query';
import { HeaderHeightContext } from 'expo-router/react-navigation';

import { CategoryCard } from '@app/components/category-card/category-card';
import { CategoryCardSkeleton } from '@app/components/category-card/category-card-skeleton';
import {
  FlashList,
  type FlashListRef,
} from '@app/components/flash-list/flash-list';
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

const renderTopCategoryItem: ListRenderItem<Category> = ({ item }) => (
  <CategoryCard category={item} />
);

const renderTopCategorySkeletonItem: ListRenderItem<unknown> = () => (
  <CategoryCardSkeleton />
);

export function TopCategoriesScreen() {
  const refreshing$ = useObservable(false);
  const refreshing = useSelector(refreshing$);
  const listRef = useRef<FlashListRef<Category>>(null);
  const { top: topInset } = useSafeAreaInsets();
  const headerHeight = use(HeaderHeightContext) ?? topInset + 44;

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

  const contentContainerStyle = useMemo(
    () =>
      [
        styles.listContent,
        Platform.OS === 'ios' && {
          paddingTop: headerHeight,
        },
      ] satisfies StyleProp<ViewStyle>,
    // oxlint-disable-next-line react-hooks/exhaustive-deps
    [headerHeight],
  );

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
          contentContainerStyle={contentContainerStyle}
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
      contentContainerStyle={contentContainerStyle}
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
  contentContainerStyle: StyleProp<ViewStyle>;
}

function TopCategoriesList({
  allCategories,
  listRef,
  onEndReached,
  onRefresh,
  refreshing,
  renderTopCategoryItem,
  contentContainerStyle,
}: TopCategoriesListProps) {
  return (
    <View
      collapsable={false}
      style={styles.wrapper}
      testID='top-categories-list'
    >
      <FlashList<Category>
        ref={listRef}
        data={allCategories}
        numColumns={3}
        contentInsetAdjustmentBehavior='automatic'
        getItemType={() => 'category-card'}
        contentContainerStyle={contentContainerStyle}
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
