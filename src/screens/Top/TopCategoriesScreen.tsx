import { CategoryCard, EmptyState, Screen, ScrollToTop } from '@app/components';
import { Skeleton } from '@app/components/Skeleton/Skeleton';
import { type Category, twitchService } from '@app/services';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import {
  FlatList,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  RefreshControl,
  View,
  type ViewStyle,
} from 'react-native';

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

export function TopCategoriesScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [previousCursor, setPreviousCursor] = useState<string | undefined>(
    undefined,
  );
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [showScrollToTop, setShowScrollToTop] = useState<boolean>(false);
  const flatListRef = useRef<FlatList<Category>>(null);

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

  if (isLoading || refreshing) {
    return (
      <Screen style={{ flex: 1 }}>
        <FlatList
          data={Array.from({ length: SKELETON_COUNT })}
          keyExtractor={(_, idx) => `skeleton-${idx}`}
          numColumns={SKELETON_COLUMNS}
          renderItem={() => <CategoryCardSkeleton />}
        />
      </Screen>
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

  const handleLoadMore = async () => {
    if (hasNextPage) {
      setPreviousCursor(cursor);
      const nextCursor =
        categories?.pages[categories.pages.length - 1]?.pagination.cursor;
      setCursor(nextCursor);
      await fetchNextPage();
    }
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetY = event.nativeEvent.contentOffset.y;

    if (offsetY > 300) {
      setShowScrollToTop(true);
    } else {
      setShowScrollToTop(false);
    }
  };

  const scrollToTop = () => {
    flatListRef.current?.scrollToOffset({ animated: true, offset: 0 });
  };

  return (
    <Screen style={{ flex: 1 }}>
      <FlatList<Category>
        data={allCategories}
        ref={flatListRef}
        renderItem={({ item }) => (
          <View style={$categoryCardContainer}>
            <CategoryCard category={item} />
          </View>
        )}
        keyExtractor={(_item, index) => index.toString()}
        numColumns={3}
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        onEndReached={handleLoadMore}
        onEndReachedThreshold={1.5}
        onRefresh={onRefresh}
        onScroll={handleScroll}
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
      {showScrollToTop && <ScrollToTop onPress={scrollToTop} />}
    </Screen>
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
