import {
  EmptyState,
  HeroHeader,
  LiveStreamCard,
  Spinner,
  Typography,
} from '@app/components';
import { useAppNavigation } from '@app/hooks';
import { AppStackParamList } from '@app/navigators';
import { twitchQueries } from '@app/queries/twitchQueries';
import { TwitchStream, twitchService } from '@app/services/twitch-service';
import {
  formatViewCount,
  getNextPageParam,
  getPreviousPageParam,
} from '@app/utils';
import { StackScreenProps } from '@react-navigation/stack';
import { FlashList, ListRenderItem } from '@shopify/flash-list';
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
  const flashListRef = useRef(null);
  const navigation = useAppNavigation();

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

  const renderItem: ListRenderItem<TwitchStream> = useCallback(({ item }) => {
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
  const totalViewers = allStreams.reduce(
    (acc, stream) => acc + stream.viewer_count,
    0,
  );

  if (allStreams.length === 0) {
    return <EmptyState content="No Top Streams found" />;
  }

  const renderHeader = () => (
    <HeroHeader
      title={category?.name ?? ''}
      subtitle={`${formatViewCount(totalViewers)} viewers`}
      backgroundImage={
        category?.box_art_url
          .replace('{width}', '600')
          .replace('{height}', '800') ?? ''
      }
      featuredImage={
        category?.box_art_url
          .replace('{width}', '300')
          .replace('{height}', '400') ?? ''
      }
      onBack={() => navigation.goBack()}
    >
      <View style={styles.sectionHeader}>
        <Typography size="sm" fontWeight="semiBold" color="gray.textLow">
          Live Channels
        </Typography>
      </View>
    </HeroHeader>
  );

  return (
    <View style={styles.container}>
      <FlashList<TwitchStream>
        ref={flashListRef}
        data={allStreams}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        ListHeaderComponent={renderHeader}
        onEndReachedThreshold={0.3}
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        onEndReached={handleLoadMore}
      />
    </View>
  );
};

const styles = StyleSheet.create(theme => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.gray.bg,
  },
  sectionHeader: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.gray.border,
  },
}));
