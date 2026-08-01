import { FC, memo, useCallback, useMemo, useRef, useState } from 'react';
import { RefreshControl, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Stack } from 'expo-router';

import {
  FlashList,
  FlashListRef,
  ListRenderItem,
} from '@app/components/FlashList/FlashList';
import { IconButton } from '@app/components/IconButton/IconButton';
import { MemoizedLiveStreamCard } from '@app/components/LiveStreamCard/LiveStreamCard';
import { LoadingState } from '@app/components/LoadingState/LoadingState';
import { ScreenHeader } from '@app/components/ScreenHeader/ScreenHeader';
import { EmptyState } from '@app/components/ui/EmptyState/EmptyState';
import { Text } from '@app/components/ui/Text/Text';
import { useCategoryQuery } from '@app/hooks/queries/useCategoryQuery';
import { useStreamsByCategoryQuery } from '@app/hooks/queries/useStreamsByCategoryQuery';
import { useFlattenedInfiniteQuery } from '@app/hooks/useFlattenedInfiniteQuery';
import { useInfiniteQueryLoadMore } from '@app/hooks/useInfiniteQueryLoadMore';
import { useScrollToTop } from '@app/hooks/useScrollToTop';
import { theme } from '@app/styles/themes';
import type { Category } from '@app/types/twitch/category';
import type { TwitchStream } from '@app/types/twitch/stream';
import { shareDeepLink } from '@app/utils/sharing/shareDeepLink';
import { formatViewCount } from '@app/utils/string/formatViewCount';

const renderCategoryStreamItem: ListRenderItem<TwitchStream> = ({ item }) => (
  <MemoizedLiveStreamCard stream={item} />
);

interface CategoryStreamsHeaderProps {
  category: Category;
  totalViewers: number;
}

const CategoryStreamsHeader = memo(function CategoryStreamsHeader({
  category,
  totalViewers,
}: CategoryStreamsHeaderProps) {
  return (
    <ScreenHeader
      size='hero'
      title={category.name}
      subtitle={`${formatViewCount(totalViewers)} viewers`}
      subtitleTestID='category-viewer-count'
      backgroundImage={
        category.box_art_url
          ?.replace('{width}', '600')
          ?.replace('{height}', '800') ?? ''
      }
      featuredImage={
        category.box_art_url
          ?.replace('{width}', '300')
          ?.replace('{height}', '400') ?? ''
      }
      back={false}
      safeArea={false}
    >
      <View style={styles.sectionHeader}>
        <Text type='sm' weight='semibold' color='gray.textLow'>
          Live Channels
        </Text>
      </View>
    </ScreenHeader>
  );
});

interface CategoryScreenProps {
  id: string;
}

export const CategoryScreen: FC<CategoryScreenProps> = ({ id }) => {
  const { t } = useTranslation('stream');
  const flashListRef = useRef<FlashListRef<TwitchStream>>(null);

  useScrollToTop(flashListRef);

  const {
    data: category,
    isLoading: isCategoryLoading,
    isError: isCategoryError,
  } = useCategoryQuery(id);

  const {
    data: streams,
    fetchNextPage,
    refetch,
    hasNextPage,
    isLoading: isLoadingStreams,
    isError: isErrorStreams,
    isFetchingNextPage,
  } = useStreamsByCategoryQuery(id);

  const handleLoadMore = useInfiniteQueryLoadMore({
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  });

  const allStreams = useFlattenedInfiniteQuery(streams?.pages);
  const totalViewers = useMemo(
    () => allStreams.reduce((acc, stream) => acc + stream.viewer_count, 0),
    [allStreams],
  );

  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refetch();
    } finally {
      setIsRefreshing(false);
    }
  }, [refetch]);

  const handleShare = useCallback(() => {
    if (!category) {
      return;
    }
    void shareDeepLink({
      kind: 'category',
      id: category.id,
      name: category.name,
    });
  }, [category]);

  const refreshControl = useMemo(
    () =>
      process.env.EXPO_OS === 'ios' ? (
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={() => {
            void handleRefresh();
          }}
          tintColor={theme.color.text.dark}
        />
      ) : undefined,
    [handleRefresh, isRefreshing],
  );

  if (isCategoryLoading || isLoadingStreams) {
    return <LoadingState />;
  }

  if (isCategoryError || isErrorStreams) {
    return (
      <EmptyState
        content={t('failedToFetchCategories')}
        heading={t('noCategories')}
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        buttonOnPress={() => refetch()}
      />
    );
  }

  if (!streams || !streams.pages) {
    return <LoadingState />;
  }

  if (allStreams.length === 0 || !category) {
    return <EmptyState content={t('noTopStreamsFound')} />;
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: category.name,
          headerRight: () => (
            <IconButton
              icon={{ type: 'symbol', name: 'square.and.arrow.up', size: 18 }}
              label={`Share ${category.name}`}
              onPress={handleShare}
              size='2xl'
            />
          ),
        }}
      />
      <FlashList<TwitchStream>
        ref={flashListRef}
        data={allStreams}
        keyExtractor={item => item.id}
        renderItem={renderCategoryStreamItem}
        drawDistance={500}
        getItemType={() => 'category-stream'}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <CategoryStreamsHeader
            category={category}
            totalViewers={totalViewers}
          />
        }
        onEndReachedThreshold={0.3}
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        onEndReached={handleLoadMore}
        refreshControl={refreshControl}
        refreshing={isRefreshing}
        onRefresh={handleRefresh}
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
