import { CategoryCard, EmptyState, FlashList } from '@app/components';
import { Skeleton } from '@app/components/Skeleton/Skeleton';
import { type Category, twitchService } from '@app/services';
import { ListRenderItem } from '@shopify/flash-list';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useCallback, useRef, useState } from 'react';
import { RefreshControl, View, type ViewStyle } from 'react-native';

const SKELETON_COUNT = 9;
const SKELETON_COLUMNS = 3;

function CategoryCardSkeleton() {
  return (
    <View style={$categoryCardContainer}>
      <Skeleton style={$skeletonImage} />
      <Skeleton style={$skeletonTitle} />
    </View>
  );
}

export default function TopCategoriesScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [previousCursor, setPreviousCursor] = useState<string | undefined>(
    undefined,
  );
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const flashListRef = useRef<FlashList<Category>>(null);

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
    getNextPageParam: lastPage => lastPage.pagination.cursor,
    getPreviousPageParam: () => previousCursor,
  });

  const handleLoadMore = useCallback(async () => {
    setPreviousCursor(cursor);
    const nextCursor =
      categories?.pages[categories.pages.length - 1]?.pagination.cursor;
    setCursor(nextCursor);
    await fetchNextPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasNextPage]);

  const renderItem: ListRenderItem<Category> = useCallback(({ item }) => {
    return (
      <View style={$categoryCardContainer}>
        <CategoryCard category={item} />
      </View>
    );
  }, []);

  const loadingRenderItem: ListRenderItem<unknown> = useCallback(() => {
    return <CategoryCardSkeleton />;
  }, []);

  if (isLoading || refreshing) {
    return (
      <FlashList
        style={{ flex: 1 }}
        data={Array.from({ length: SKELETON_COUNT })}
        keyExtractor={(_, idx) => `skeleton-${idx}`}
        numColumns={SKELETON_COLUMNS}
        renderItem={loadingRenderItem}
      />
    );
  }

  if (!isLoading && !refreshing && isError) {
    return (
      <EmptyState
        heading="Failed to fetch categories"
        content="Failed to fetch top categories"
      />
    );
  }

  const onRefresh = () => {
    setRefreshing(true);
    void refetch();
    setRefreshing(false);
  };

  const allCategories = categories?.pages.flatMap(page => page.data) ?? [];

  if (allCategories.length === 0) {
    return (
      <EmptyState
        content="No categories found"
        buttonOnPress={() => onRefresh()}
      />
    );
  }

  return (
    <FlashList<Category>
      data={allCategories}
      style={{ flex: 1 }}
      numColumns={3}
      ref={flashListRef}
      renderItem={renderItem}
      keyExtractor={(_item, index) => index.toString()}
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
  );
}

const $categoryCardContainer: ViewStyle = {
  flex: 1,
  margin: 5,
};

const $skeletonImage: ViewStyle = {
  width: 110,
  height: 150,
  borderRadius: 8,
  alignSelf: 'center',
  marginBottom: 8,
};

const $skeletonTitle: ViewStyle = {
  width: 80,
  height: 18,
  borderRadius: 4,
  alignSelf: 'center',
};
