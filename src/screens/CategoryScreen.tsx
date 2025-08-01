import {
  EmptyState,
  Image,
  LiveStreamCard,
  Spinner,
  Typography,
  FlashList,
} from '@app/components';
import { AppStackParamList } from '@app/navigators';
import { twitchQueries } from '@app/queries/twitchQueries';
import { Stream, twitchService } from '@app/services';
import { getNextPageParam, getPreviousPageParam } from '@app/utils';
import { StackScreenProps } from '@react-navigation/stack';
import { ListRenderItem } from '@shopify/flash-list';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { FC, useCallback, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

export const CategoryScreen: FC<
  StackScreenProps<AppStackParamList, 'Category'>
> = ({ route: { params } }) => {
  const { id } = params;
  const [previousCursor, setPreviousCursor] = useState<string>('');
  const [cursor, setCursor] = useState<string>('');
  const flashListRef = useRef<FlashList<Stream>>(null);

  const categoryQuery = useMemo(() => twitchQueries.getCategory(id), [id]);

  const {
    data: category,
    isLoading: isCategoryLoading,
    isError: isCategoryError,
  } = useQuery(categoryQuery);

  const {
    data: streams,
    fetchNextPage,
    refetch,
    hasNextPage,
    isLoading: isLoadingStreams,
    isError: isErrorStreams,
  } = useInfiniteQuery({
    queryFn: ({ pageParam }) =>
      twitchService.getStreamsByCategory(id, pageParam),
    queryKey: ['Category', id],
    getNextPageParam,
    getPreviousPageParam,
    initialPageParam: previousCursor,
  });

  const handleLoadMore = useCallback(async () => {
    setPreviousCursor(cursor);
    const nextCursor =
      streams?.pages[streams.pages.length - 1]?.pagination.cursor;
    setCursor(nextCursor as string);
    await fetchNextPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasNextPage]);

  const renderItem: ListRenderItem<Stream> = useCallback(({ item }) => {
    return <LiveStreamCard stream={item} />;
  }, []);

  if (isCategoryLoading || isLoadingStreams) {
    return <Spinner />;
  }

  if (isCategoryError || isErrorStreams) {
    return (
      <EmptyState
        content="Failed to fetch categories"
        heading="No Categories"
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        buttonOnPress={() => refetch()}
      />
    );
  }

  const allStreams = streams?.pages.flatMap(page => page.data) ?? [];

  if (allStreams.length === 0) {
    return <EmptyState content="No Top Streams found" />;
  }

  const renderHeader = () => (
    <View style={styles.headerContent}>
      <Image
        source={
          category?.box_art_url
            .replace('{width}', '600')
            .replace('{height}', '1080') ?? ''
        }
        style={styles.categoryLogo}
      />
      <Typography style={styles.categoryTitle}>{category?.name}</Typography>
    </View>
  );

  return (
    <FlashList<Stream>
      ref={flashListRef}
      data={allStreams}
      style={{ flex: 1 }}
      keyExtractor={item => item.id}
      renderItem={renderItem}
      ListHeaderComponent={renderHeader}
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      onEndReached={handleLoadMore}
    />
  );
};

const styles = StyleSheet.create(theme => ({
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
