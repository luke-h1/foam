import { EmptyState } from '@app/components/EmptyState';
import { LiveStreamCard } from '@app/components/LiveStreamCard';
import { HeroHeader } from '@app/components/ScreenHeader/HeroHeader';
import { Spinner } from '@app/components/Spinner';
import { Typography } from '@app/components/Typography';
import { useAppNavigation } from '@app/hooks/useAppNavigation';
import { AppStackParamList } from '@app/navigators/AppNavigator';
import { TwitchStream, twitchService } from '@app/services/twitch-service';
import {
  getNextPageParam,
  getPreviousPageParam,
} from '@app/utils/pagination/pagination';
import { formatViewCount } from '@app/utils/string/formatViewCount';
import { StackScreenProps } from '@react-navigation/stack';
import { FlashList, ListRenderItem } from '@shopify/flash-list';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { FC, useCallback, useRef } from 'react';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

export const CategoryScreen: FC<
  StackScreenProps<AppStackParamList, 'Category'>
> = ({ route: { params } }) => {
  const { id } = params;
  const flashListRef = useRef(null);
  const navigation = useAppNavigation();

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

  if (!streams || !streams.pages) {
    return <Spinner />;
  }

  const allStreams =
    streams.pages.flatMap(page => (page?.data ? page.data : [])) ?? [];
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
      safeArea={false}
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
        contentInsetAdjustmentBehavior="automatic"
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
