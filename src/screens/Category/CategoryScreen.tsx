import StreamStackCard from '@app/components/StreamStackCard';
import EmptyState from '@app/components/ui/EmptyState';
import Screen from '@app/components/ui/Screen';
import Spinner from '@app/components/ui/Spinner';
import { Text } from '@app/components/ui/Text';
import useHeader from '@app/hooks/useHeader';
import { AppStackParamList } from '@app/navigators';
import BackButton from '@app/navigators/BackButton';
import twitchQueries from '@app/queries/twitchQueries';
import twitchService, { Stream } from '@app/services/twitchService';
import { spacing } from '@app/styles';
import { StackScreenProps } from '@react-navigation/stack';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { FC, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  ImageStyle,
  NativeScrollEvent,
  NativeSyntheticEvent,
  RefreshControl,
  TextStyle,
  View,
  ViewStyle,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

const CategoryScreen: FC<StackScreenProps<AppStackParamList, 'Category'>> = ({
  route: { params },
}) => {
  const { id } = params;
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [previousCursor, setPreviousCursor] = useState<string | undefined>(
    undefined,
  );
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [showScrollToTop, setShowScrollToTop] = useState<boolean>(false);
  const flatListRef = useRef<FlatList<Stream>>(null);

  const categoryQuery = useMemo(() => twitchQueries.getCategory(id), [id]);

  const {
    data: category,
    isLoading: isCategoryLoading,
    isError: isCategoryError,
  } = useQuery(categoryQuery);

  useHeader(
    {
      title: category?.name ?? 'Categories',
      LeftActionComponent: <BackButton />,
    },
    [category],
  );

  const {
    data: streams,
    fetchNextPage,
    refetch,
    hasNextPage,
    isLoading: isLoadingStreams,
    isError: isErrorStreams,
  } = useInfiniteQuery({
    queryKey: ['StreamsByCategory', id],
    queryFn: ({ pageParam }: { pageParam?: string }) =>
      twitchService.getStreamsByCategory(id, pageParam),
    initialPageParam: cursor,
    getNextPageParam: lastPage => lastPage.pagination.cursor,
    getPreviousPageParam: () => previousCursor,
  });

  if (isCategoryLoading || isLoadingStreams || refreshing) {
    return <Spinner />;
  }

  if (isCategoryError || isErrorStreams) {
    return (
      <EmptyState
        content="Failed to fetch categories"
        heading="No Categories"
        buttonOnPress={() => refetch()}
      />
    );
  }

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const allStreams = streams?.pages.flatMap(page => page.data) ?? [];

  if (allStreams.length === 0) {
    return (
      <EmptyState content="No Top Streams found" buttonOnPress={onRefresh} />
    );
  }

  const handleLoadMore = async () => {
    if (hasNextPage) {
      setPreviousCursor(cursor);
      const nextCursor =
        streams?.pages[streams.pages.length - 1].pagination.cursor;
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

  const renderHeader = () => (
    <View style={$headerContent}>
      <Image
        source={{
          uri: category?.box_art_url
            .replace('{width}', '600')
            .replace('{height}', '1080'),
        }}
        style={$categoryLogo}
      />
      <Text style={$categoryTitle}>{category?.name}</Text>
    </View>
  );

  return (
    <Screen style={{ flex: 1 }}>
      <FlatList<Stream>
        ref={flatListRef}
        data={allStreams}
        keyExtractor={item => item.id}
        renderItem={({ item }) => <StreamStackCard stream={item} />}
        ListHeaderComponent={renderHeader}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.2}
        refreshing={refreshing}
        onScroll={handleScroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="white"
            colors={['white']}
          />
        }
      />
      {showScrollToTop && (
        <TouchableOpacity
          style={styles.scrollToTopButton}
          onPress={scrollToTop}
        >
          <Text style={styles.scrollToTopText}>TOP</Text>
        </TouchableOpacity>
      )}
    </Screen>
  );
};

export default CategoryScreen;

const $headerContent: ViewStyle = {
  flexDirection: 'row',
  alignItems: 'flex-start',
  justifyContent: 'flex-start',
  display: 'flex',
  marginBottom: spacing.large,
};
const $categoryLogo: ImageStyle = {
  width: 105,
  height: 140,
  borderRadius: 12,
  resizeMode: 'cover',
};
const $categoryTitle: TextStyle = {
  textAlign: 'center',
  marginLeft: spacing.medium,
  fontWeight: 'bold',
};

const styles = StyleSheet.create({
  scrollToTopButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 25,
    padding: 10,
  },
  scrollToTopText: {
    color: 'white',
    fontWeight: 'bold',
  },
});
