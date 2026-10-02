import { type ReactNode, type RefObject, useCallback } from 'react';
import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';

import { ListRenderItem } from '@shopify/flash-list';
import { router } from 'expo-router';

import { FlashList, FlashListRef } from '@app/components/flash-list/flash-list';
import { Image } from '@app/components/image/image';
import { PressableArea } from '@app/components/pressable-area/pressable-area';
import { SegmentedControl } from '@app/components/segmented-control/segmented-control';
import { EmptyState } from '@app/components/ui/empty-state/empty-state';
import { SearchHistory } from '@app/components/ui/search-history/search-history';
import { Text } from '@app/components/ui/text/text';
import { theme } from '@app/styles/themes';
import type { Category } from '@app/types/twitch/category';
import type { SearchChannelResponse } from '@app/types/twitch/channel';

import { SearchDiscover } from './components/search-discover';
import { SearchInputBar } from './components/search-input-bar/search-input-bar';
import { SearchResultsSkeleton } from './components/search-results-skeleton';
import { StreamerCard } from './components/streamer-card';
import { useSearchController } from './hooks/use-search-controller';
import {
  getSearchResultKey,
  isSearchChannelItem,
  MIN_SEARCH_QUERY_LENGTH,
  type SearchFilter,
  type SearchItem,
  type SearchStatus,
} from './util/search-state';

/**
 * Keeps row separators aligned with the text column, past the avatar or box
 * art.
 */
const RESULT_THUMBNAIL_WIDTH = 48;

const RESULT_SEPARATOR_INSET =
  theme.space16 + RESULT_THUMBNAIL_WIDTH + theme.space16;

function ResultRow({
  children,
  onPress,
  style,
}: {
  children: ReactNode;
  onPress: () => void;
  style: StyleProp<ViewStyle>;
}) {
  return (
    <PressableArea feedback='highlight' onPress={onPress}>
      <View style={style}>{children}</View>
    </PressableArea>
  );
}

function ResultSeparator() {
  return <View style={styles.separator} />;
}

export function SearchScreen() {
  const {
    activeResults,
    handleCategoryPress,
    handleClearSearch,
    handleFilterChange,
    handleQuerySearch,
    handleRefresh,
    handleSearchHistoryClearAll,
    handleSearchHistoryClearItem,
    handleSearchHistorySelect,
    handleSearchSubmit,
    handleTextChange,
    isRefreshing,
    listRef,
    query,
    searchBarRef,
    searchHistoryQueries,
    searchResults,
    selectedFilter,
    status,
  } = useSearchController();

  const renderItem: ListRenderItem<SearchChannelResponse> = useCallback(
    ({ item }) => {
      return (
        <ResultRow
          onPress={() => {
            router.push(`/streams/live-stream/${item.broadcaster_login}`);
          }}
          style={styles.resultItem}
        >
          <StreamerCard stream={item} />
        </ResultRow>
      );
    },
    [],
  );

  const renderCategoryItem: ListRenderItem<Category> = useCallback(
    ({ item }) => {
      const imageUrl =
        item.box_art_url
          ?.replace('{width}', '220')
          ?.replace('{height}', '294') ?? '';

      return (
        <ResultRow
          onPress={() => handleCategoryPress(item.id)}
          style={styles.categoryResultItem}
        >
          <Image
            source={imageUrl}
            cacheVariant='thumbnail'
            style={styles.categoryResultImage}
          />
          <Text type='body' numberOfLines={2} style={styles.categoryResultName}>
            {item.name}
          </Text>
        </ResultRow>
      );
    },
    [handleCategoryPress],
  );

  const handleRetry = useCallback(() => {
    void handleQuerySearch(query.trim());
  }, [handleQuerySearch, query]);

  const showSearchHistory =
    query.trim().length === 0 && searchHistoryQueries.length > 0;

  const listEmpty = (
    <SearchResultsEmpty
      onRetry={handleRetry}
      query={query.trim()}
      selectedFilter={selectedFilter}
      status={status}
    />
  );

  const listHeader = (
    <View>
      {showSearchHistory ? (
        <SearchHistory
          history={searchHistoryQueries}
          onClearAll={handleSearchHistoryClearAll}
          onSelectItem={handleSearchHistorySelect}
          onClearItem={handleSearchHistoryClearItem}
        />
      ) : null}
      <SearchHeader
        activeResults={activeResults}
        handleFilterChange={handleFilterChange}
        query={query}
        searchResultsLength={searchResults.length}
        selectedFilter={selectedFilter}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <SearchInputBar
        ref={searchBarRef}
        onCancel={handleClearSearch}
        onChangeText={handleTextChange}
        onSubmit={handleSearchSubmit}
        placeholder='Search channels, games'
        value={query}
      />
      <SearchResultsList
        activeResults={activeResults}
        listEmpty={listEmpty}
        listHeader={listHeader}
        listRef={listRef}
        onRefresh={handleRefresh}
        refreshing={isRefreshing}
        renderCategoryItem={renderCategoryItem}
        renderItem={renderItem}
        selectedFilter={selectedFilter}
      />
    </View>
  );
}

type SearchHeaderProps = {
  activeResults: SearchItem[];
  handleFilterChange: (index: number) => void;
  query: string;
  searchResultsLength: number;
  selectedFilter: SearchFilter;
};

function SearchHeader({
  activeResults,
  handleFilterChange,
  query,
  searchResultsLength,
  selectedFilter,
}: SearchHeaderProps) {
  const hasQuery = query.length > 0;

  if (!hasQuery && searchResultsLength === 0) {
    return <SearchDiscover />;
  }

  // The filter only changes results, so it appears once there is a query.
  return (
    <View style={styles.filterBar}>
      <SegmentedControl
        currentIndex={selectedFilter === 'channels' ? 0 : 1}
        onChange={handleFilterChange}
        items={[{ label: 'Channels' }, { label: 'Categories' }]}
      />
      {activeResults.length > 0 ? null : <View style={styles.filterGap} />}
    </View>
  );
}

interface SearchResultsEmptyProps {
  onRetry: () => void;
  query: string;
  selectedFilter: SearchFilter;
  status: SearchStatus;
}

function SearchResultsEmpty({
  onRetry,
  query,
  selectedFilter,
  status,
}: SearchResultsEmptyProps) {
  if (status === 'searching') {
    return <SearchResultsSkeleton />;
  }

  if (status === 'error') {
    return (
      <EmptyState
        style={styles.listEmpty}
        iconName='exclamationmark.triangle'
        heading="Couldn't search"
        content='Check your connection and try again.'
        button='Try again'
        buttonOnPress={onRetry}
      />
    );
  }

  if (status === 'done' && query.length >= MIN_SEARCH_QUERY_LENGTH) {
    return (
      <EmptyState
        style={styles.listEmpty}
        iconName='magnifyingglass'
        heading={`No ${selectedFilter} for "${query}"`}
        content='Check the spelling, or try a shorter search.'
      />
    );
  }

  return null;
}

type SearchResultsListProps = {
  activeResults: SearchItem[];
  listEmpty: React.ReactElement;
  listHeader: React.ReactElement;
  listRef: RefObject<FlashListRef<SearchItem> | null>;
  onRefresh: () => Promise<void>;
  refreshing: boolean;
  renderCategoryItem: ListRenderItem<Category>;
  renderItem: ListRenderItem<SearchChannelResponse>;
  selectedFilter: SearchFilter;
};

function SearchResultsList({
  activeResults,
  listEmpty,
  listHeader,
  listRef,
  onRefresh,
  refreshing,
  renderCategoryItem,
  renderItem,
  selectedFilter,
}: SearchResultsListProps) {
  // SAFETY: activeResults is searchResults, which only holds SearchChannelResponse rows, whenever the channels filter is selected.
  const renderChannelRow = renderItem as ListRenderItem<SearchItem>;

  // SAFETY: activeResults is categoryResults, which only holds Category rows, for every other filter.
  const renderCategoryRow = renderCategoryItem as ListRenderItem<SearchItem>;

  return (
    <FlashList
      ref={listRef}
      getItemType={item =>
        isSearchChannelItem(item) ? 'search-channel' : 'search-category'
      }
      indicatorStyle='white'
      contentInsetAdjustmentBehavior='automatic'
      ItemSeparatorComponent={ResultSeparator}
      data={activeResults}
      keyboardDismissMode='on-drag'
      keyboardShouldPersistTaps='handled'
      ListHeaderComponent={listHeader}
      ListEmptyComponent={listEmpty}
      refreshing={refreshing}
      onRefresh={onRefresh}
      renderItem={
        selectedFilter === 'channels' ? renderChannelRow : renderCategoryRow
      }
      keyExtractor={getSearchResultKey}
      style={styles.resultsList}
    />
  );
}

const styles = StyleSheet.create({
  categoryResultImage: {
    borderCurve: 'continuous',
    borderRadius: theme.radius.sm,
    height: 64,
    width: RESULT_THUMBNAIL_WIDTH,
  },
  categoryResultItem: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.space16,
    paddingHorizontal: theme.space16,
    paddingVertical: theme.space8,
  },
  categoryResultName: {
    flex: 1,
  },
  container: {
    backgroundColor: theme.color.background.dark,
    flex: 1,
  },
  filterBar: {
    paddingBottom: theme.space8,
    paddingHorizontal: theme.space16,
    paddingTop: theme.space4,
  },
  filterGap: {
    height: theme.space8,
  },
  listEmpty: {
    paddingTop: theme.space24,
  },
  resultItem: {
    flexDirection: 'row',
    paddingHorizontal: theme.space16,
    paddingVertical: theme.space8,
  },
  resultsList: {
    flex: 1,
  },
  separator: {
    backgroundColor: theme.color.border.dark,
    height: StyleSheet.hairlineWidth,
    marginStart: RESULT_SEPARATOR_INSET,
  },
});
