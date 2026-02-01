import { CategoryCard } from '@app/components/CategoryCard';
import { EmptyState } from '@app/components/EmptyState';
import { FlashList } from '@app/components/FlashList';
import { Skeleton } from '@app/components/Skeleton/Skeleton';
import { Category, twitchService } from '@app/services/twitch-service';
import { ListRenderItem } from '@shopify/flash-list';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useCallback, useRef, useState } from 'react';
import { RefreshControl, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

const SKELETON_COUNT = 9;
const SKELETON_COLUMNS = 3;

function CategoryCardSkeleton() {
  return (
    <View style={styles.cardContainer}>
      <Skeleton style={styles.skeletonImage} />
      <Skeleton style={styles.skeletonTitle} />
    </View>
  );
}

export function TopCategoriesScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [previousCursor, setPreviousCursor] = useState<string | undefined>(
    undefined,
  );
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const flashListRef = useRef(null);

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
    initialPageParam: cursor,
    getNextPageParam: lastPage => lastPage?.pagination?.cursor,
    getPreviousPageParam: () => previousCursor,
  });

  const handleLoadMore = useCallback(async () => {
    setPreviousCursor(cursor);
    const nextCursor =
      categories?.pages?.[categories.pages.length - 1]?.pagination?.cursor;
    setCursor(nextCursor);
    await fetchNextPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasNextPage]);

  const renderItem: ListRenderItem<Category> = useCallback(({ item }) => {
    return (
      <View style={styles.cardContainer}>
        <CategoryCard category={item} />
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
          contentInsetAdjustmentBehavior="automatic"
          data={Array.from({ length: SKELETON_COUNT })}
          keyExtractor={(_, idx) => `skeleton-${idx}`}
          numColumns={SKELETON_COLUMNS}
          renderItem={loadingRenderItem}
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

  const onRefresh = () => {
    setRefreshing(true);
    void refetch();
    setRefreshing(false);
  };

  const allCategories =
    categories?.pages.flatMap(page => page.data).filter(Boolean) ?? [];

  if (allCategories.length === 0) {
    return (
      <View style={styles.wrapper}>
        <EmptyState
          content="No categories found"
          buttonOnPress={() => onRefresh()}
        />
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      <FlashList<Category>
        data={allCategories}
        numColumns={3}
        ref={flashListRef}
        contentInsetAdjustmentBehavior="automatic"
        renderItem={renderItem}
        keyExtractor={item => item.id}
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.4}
        onRefresh={onRefresh}
        refreshing={refreshing}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="white"
            colors={['white']}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    flex: 1,
    margin: 5,
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
    height: 18,
    width: 80,
  },
  wrapper: {
    flex: 1,
  },
});
