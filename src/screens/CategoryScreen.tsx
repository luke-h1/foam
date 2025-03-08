import {
  EmptyState,
  LiveStreamCard,
  Screen,
  ScrollToTop,
  Spinner,
  Typography,
} from '@app/components';
import { useHeader } from '@app/hooks';
import { AppStackParamList, BackButton } from '@app/navigators';
import { twitchQueries } from '@app/queries/twitchQueries';
import { Stream, twitchService } from '@app/services';
import { StackScreenProps } from '@react-navigation/stack';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { FC, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  RefreshControl,
  View,
} from 'react-native';
import { createStyleSheet, useStyles } from 'react-native-unistyles';
import { toast } from 'sonner-native';

export const CategoryScreen: FC<
  StackScreenProps<AppStackParamList, 'Category'>
> = ({ route: { params } }) => {
  const { id } = params;
  const { styles } = useStyles(stylesheet);
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
    toast.error('Failed to fetch categories');
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
        streams?.pages[streams.pages.length - 1]?.pagination.cursor;
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
    <View style={styles.headerContent}>
      <Image
        source={{
          uri: category?.box_art_url
            .replace('{width}', '600')
            .replace('{height}', '1080'),
        }}
        style={styles.categoryLogo}
      />
      <Typography style={styles.categoryTitle}>{category?.name}</Typography>
    </View>
  );

  return (
    <Screen style={{ flex: 1 }}>
      <FlatList<Stream>
        ref={flatListRef}
        data={allStreams}
        keyExtractor={item => item.id}
        renderItem={({ item }) => <LiveStreamCard stream={item} />}
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
      {showScrollToTop && <ScrollToTop onPress={scrollToTop} />}
    </Screen>
  );
};

const stylesheet = createStyleSheet(theme => ({
  headerContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    display: 'flex',
    marginBottom: theme.spacing.lg,
  },
  categoryLogo: {
    width: 105,
    height: 140,
    borderRadius: 12,
    resizeMode: 'cover',
  },
  categoryTitle: {
    textAlign: 'center',
    marginLeft: theme.spacing.md,
    fontWeight: 'bold',
  },
}));
