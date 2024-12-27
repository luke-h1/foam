import CategoryCard from '@app/components/CategoryCard';
import ScrollToTop from '@app/components/ScrollToTop';
import EmptyState from '@app/components/ui/EmptyState';
import Screen from '@app/components/ui/Screen';
import Spinner from '@app/components/ui/Spinner';
import twitchService, { Category } from '@app/services/twitchService';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import {
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  RefreshControl,
  View,
  ViewStyle,
} from 'react-native';

export default function TopCategoriesScreen() {
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
  } = useInfiniteQuery({
    queryKey: ['TopCategories'],
    queryFn: ({ pageParam }: { pageParam?: string }) =>
      twitchService.getTopCategories(pageParam as string),
    initialPageParam: cursor,
    getNextPageParam: lastPage => lastPage.pagination.cursor,
    getPreviousPageParam: () => previousCursor,
  });

  if (isLoading || refreshing) {
    return <Spinner />;
  }

  const onRefresh = async () => {
    setRefreshing(true);
    refetch();
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
        categories?.pages[categories.pages.length - 1].pagination.cursor;
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
