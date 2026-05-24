import {
  CATEGORY_CARD_HEIGHT,
  MemoizedCategoryCard,
} from '@app/components/CategoryCard/CategoryCard';
import { EmptyState } from '@app/components/ui/EmptyState/EmptyState';
import {
  AnimatedFlashList,
  FlashList,
  FlashListRef,
} from '@app/components/FlashList/FlashList';
import { RefreshControl } from '@app/components/RefreshControl/RefreshControl';
import { Skeleton } from '@app/components/ui/Skeleton/Skeleton';
import { useScrollToTop } from '@app/hooks/useScrollToTop';
import { Category, twitchService } from '@app/services/twitch-service';
import { theme } from '@app/styles/themes';
import type { ListRenderItem } from '@shopify/flash-list';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useCallback, useMemo, useRef, useState } from 'react';
import { Platform, View, StyleSheet } from 'react-native';
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
  const [refreshing, setRefreshing] = useState(false);
  const listRef = useRef<FlashListRef<Category>>(null);
  const skeletonData = useMemo(
    () => Array.from({ length: SKELETON_COUNT }),
    [],
  );

  useScrollToTop(listRef);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: event => {
      if (scrollY) {
        scrollY.value = event.contentOffset.y;
      }
    },
  });

  const {
    data: categories,
    fetchNextPage,
    refetch,
    hasNextPage,
    isLoading,
    isError,
  } = useInfiniteQuery({
    queryKey: ['TopCategories'],
    queryFn: ({ pageParam }: { pageParam?: string }) =>
      twitchService.getTopCategories(pageParam as string),
    initialPageParam: undefined,
    staleTime: 60_000,
    getNextPageParam: lastPage => lastPage?.pagination?.cursor,
    getPreviousPageParam: () => undefined,
  });

  const handleLoadMore = useCallback(async () => {
    if (!hasNextPage) {
      return;
    }

    await fetchNextPage();
  }, [fetchNextPage, hasNextPage]);

  const renderItem: ListRenderItem<Category> = useCallback(({ item }) => {
    return (
      <View style={styles.cardContainer}>
        <MemoizedCategoryCard category={item} />
      </View>
    );
  }, []);

  const loadingRenderItem: ListRenderItem<unknown> = useCallback(() => {
    return <CategoryCardSkeleton />;
  }, []);

  if (isLoading || refreshing) {
    return (
      <View style={styles.wrapper}>
        <FlashList
          getItemType={() => 'category-skeleton'}
          contentInsetAdjustmentBehavior="automatic"
          data={skeletonData}
          keyExtractor={(_, idx) => `${TOP_CATEGORY_SKELETON_KEY_PREFIX}${idx}`}
          numColumns={SKELETON_COLUMNS}
          renderItem={loadingRenderItem}
          contentContainerStyle={[
            styles.listContent,
            { paddingTop: contentTopInset },
          ]}
        />
      </View>
    );
  }

  if (!isLoading && !refreshing && isError) {
    return (
      <View style={styles.wrapper}>
        <EmptyState
          heading="Failed to fetch categories"
          content="Failed to fetch top categories"
        />
      </View>
    );
  }

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const allCategories = useMemo(
    () => categories?.pages.flatMap(page => page.data).filter(Boolean) ?? [],
    [categories],
  );

  if (allCategories.length === 0) {
    return (
      <View style={styles.wrapper}>
        <EmptyState
          content="No categories found"
          buttonOnPress={() => void onRefresh()}
        />
      </View>
    );
  }

  const refreshControl =
    Platform.OS === 'android' ? undefined : (
      <RefreshControl onRefresh={onRefresh} />
    );

  return (
    <View style={styles.wrapper}>
      <AnimatedFlashList<Category>
        ref={listRef}
        data={allCategories}
        numColumns={3}
        contentInsetAdjustmentBehavior="automatic"
        getItemType={() => 'category-card'}
        contentContainerStyle={[
          styles.listContent,
          { paddingTop: contentTopInset },
        ]}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        onEndReached={handleLoadMore}
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
