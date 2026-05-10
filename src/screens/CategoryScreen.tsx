import { EmptyState } from '@app/components/EmptyState/EmptyState';
import {
  FlashList,
  FlashListRef,
  ListRenderItem,
} from '@app/components/FlashList/FlashList';
import { MemoizedLiveStreamCard } from '@app/components/LiveStreamCard/LiveStreamCard';
import { ScreenHeader } from '@app/components/ScreenHeader/ScreenHeader';
import { Spinner } from '@app/components/Spinner/Spinner';
import { Text } from '@app/components/Text/Text';
import { useScrollToTop } from '@app/hooks/useScrollToTop';
import { TwitchStream, twitchService } from '@app/services/twitch-service';
import { theme } from '@app/styles/themes';
import {
  getNextPageParam,
  getPreviousPageParam,
} from '@app/utils/pagination/pagination';
import { formatViewCount } from '@app/utils/string/formatViewCount';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { FC, useCallback, useMemo, useRef } from 'react';
import { Platform, View, StyleSheet } from 'react-native';

interface CategoryScreenProps {
  id: string;
}

export const CategoryScreen: FC<CategoryScreenProps> = ({ id }) => {
  const flashListRef = useRef<FlashListRef<TwitchStream>>(null);

  useScrollToTop(flashListRef);

  const {
    data: category,
    isLoading: isCategoryLoading,
    isError: isCategoryError,
  } = useQuery({
    queryKey: ['category', id],
    queryFn: () => twitchService.getCategory(id),
  });

  const {
    data: streams,
    fetchNextPage,
    refetch,
    hasNextPage,
    isLoading: isLoadingStreams,
    isError: isErrorStreams,
  } = useInfiniteQuery({
    queryKey: ['streamsByCategory', id],
    queryFn: ({ pageParam }: { pageParam?: string }) =>
      twitchService.getStreamsByCategory(id, pageParam),
    initialPageParam: undefined,
    getNextPageParam,
    getPreviousPageParam,
  });

  const handleLoadMore = useCallback(async () => {
    if (hasNextPage) {
      await fetchNextPage();
    }
  }, [hasNextPage, fetchNextPage]);

  const renderItem: ListRenderItem<TwitchStream> = useCallback(({ item }) => {
    return <MemoizedLiveStreamCard stream={item} />;
  }, []);

  const allStreams =
    streams?.pages?.flatMap(page => (page?.data ? page.data : [])) ?? [];
  const totalViewers = allStreams.reduce(
    (acc, stream) => acc + stream.viewer_count,
    0,
  );

  const renderHeader = useMemo(
    () => (
      <ScreenHeader
        size="hero"
        title={category?.name ?? ''}
        subtitle={`${formatViewCount(totalViewers)} viewers`}
        backgroundImage={
          category?.box_art_url
            ?.replace('{width}', '600')
            ?.replace('{height}', '800') ?? ''
        }
        featuredImage={
          category?.box_art_url
            ?.replace('{width}', '300')
            ?.replace('{height}', '400') ?? ''
        }
        onBack={() => router.back()}
        safeArea={false}
      >
        <View style={styles.sectionHeader}>
          <Text type="sm" weight="semibold" color="gray.textLow">
            Live Channels
          </Text>
        </View>
      </ScreenHeader>
    ),
    [category?.name, category?.box_art_url, totalViewers],
  );

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

  if (!streams || !streams.pages) {
    return <Spinner />;
  }

  if (allStreams.length === 0) {
    return <EmptyState content="No Top Streams found" />;
  }

  return (
    <View style={styles.container}>
      <FlashList<TwitchStream>
        ref={flashListRef}
        data={allStreams}
        contentInsetAdjustmentBehavior="automatic"
        keyExtractor={item => item.id}
        renderItem={renderItem}
        drawDistance={Platform.OS === 'ios' ? 500 : undefined}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={renderHeader}
        onEndReachedThreshold={0.3}
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        onEndReached={handleLoadMore}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.color.background.dark,
    flex: 1,
  },
  listContent: {
    paddingBottom: theme.space20,
  },
  sectionHeader: {
    borderBottomColor: theme.color.border.dark,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: theme.space16,
    paddingVertical: theme.space12,
  },
});
