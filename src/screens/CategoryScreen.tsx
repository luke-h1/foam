import { EmptyState } from '@app/components/ui/EmptyState/EmptyState';
import {
  FlashList,
  FlashListRef,
  ListRenderItem,
} from '@app/components/FlashList/FlashList';
import { IconButton } from '@app/components/IconButton/IconButton';
import { LoadingState } from '@app/components/LoadingState/LoadingState';
import { MemoizedLiveStreamCard } from '@app/components/LiveStreamCard/LiveStreamCard';
import { ScreenHeader } from '@app/components/ScreenHeader/ScreenHeader';
import { Text } from '@app/components/ui/Text/Text';
import { shareDeepLink } from '@app/utils/sharing/shareDeepLink';
import { useInfiniteQueryLoadMore } from '@app/hooks/useInfiniteQueryLoadMore';
import { useScrollToTop } from '@app/hooks/useScrollToTop';
import { TwitchStream, twitchService } from '@app/services/twitch-service';
import { theme } from '@app/styles/themes';
import { flattenInfiniteQueryPages } from '@app/utils/pagination/flattenInfiniteQueryPages';
import {
  getNextPageParam,
  getPreviousPageParam,
} from '@app/utils/pagination/pagination';
import { formatViewCount } from '@app/utils/string/formatViewCount';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { FC, useRef } from 'react';
import { Platform, View, StyleSheet } from 'react-native';

const renderCategoryStreamItem: ListRenderItem<TwitchStream> = ({ item }) => (
  <MemoizedLiveStreamCard stream={item} />
);

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
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['streamsByCategory', id],
    queryFn: ({ pageParam }: { pageParam?: string }) =>
      twitchService.getStreamsByCategory(id, pageParam),
    initialPageParam: undefined,
    getNextPageParam,
    getPreviousPageParam,
  });

  const handleLoadMore = useInfiniteQueryLoadMore({
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  });

  const allStreams = flattenInfiniteQueryPages(streams?.pages);
  const totalViewers = allStreams.reduce(
    (acc, stream) => acc + stream.viewer_count,
    0,
  );

  const renderHeader = (
    <ScreenHeader
      size='hero'
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
      trailing={
        category ? (
          <IconButton
            icon={{ type: 'symbol', name: 'square.and.arrow.up', size: 18 }}
            label={`Share ${category.name}`}
            onPress={() => {
              void shareDeepLink({
                kind: 'category',
                id: category.id,
                name: category.name,
              });
            }}
            size='2xl'
          />
        ) : undefined
      }
    >
      <View style={styles.sectionHeader}>
        <Text type='sm' weight='semibold' color='gray.textLow'>
          Live Channels
        </Text>
      </View>
    </ScreenHeader>
  );

  if (isCategoryLoading || isLoadingStreams) {
    return <LoadingState />;
  }

  if (isCategoryError || isErrorStreams) {
    return (
      <EmptyState
        content='Failed to fetch categories'
        heading='No Categories'
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        buttonOnPress={() => refetch()}
      />
    );
  }

  if (!streams || !streams.pages) {
    return <LoadingState />;
  }

  if (allStreams.length === 0) {
    return <EmptyState content='No Top Streams found' />;
  }

  return (
    <View style={styles.container}>
      <FlashList<TwitchStream>
        ref={flashListRef}
        data={allStreams}
        contentInsetAdjustmentBehavior='automatic'
        keyExtractor={item => item.id}
        renderItem={renderCategoryStreamItem}
        drawDistance={Platform.OS === 'ios' ? 500 : undefined}
        getItemType={() => 'category-stream'}
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
