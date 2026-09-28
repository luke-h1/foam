import { type ReactNode, type RefObject, useCallback } from 'react';
import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';
import { Pressable } from 'react-native-gesture-handler';

import { ListRenderItem } from '@shopify/flash-list';
import { router } from 'expo-router';

import { Button } from '@app/components/button/button';
import { FlashList, FlashListRef } from '@app/components/flash-list/flash-list';
import { Image } from '@app/components/image/image';
import { SegmentedControl } from '@app/components/segmented-control/segmented-control';
import { EmptyState } from '@app/components/ui/empty-state/empty-state';
import { SearchHistory } from '@app/components/ui/search-history/search-history';
import { Text } from '@app/components/ui/text/text';
import { theme } from '@app/styles/themes';
import type { Category } from '@app/types/twitch/category';
import type { SearchChannelResponse } from '@app/types/twitch/channel';

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

const SEARCH_QUICK_ACTIONS = [
  {
    title: 'Just Chatting',
    subtitle: 'Jump into the busiest live conversations',
    query: 'just chatting',
  },
  {
    title: 'Valorant',
    subtitle: 'Check competitive streams and ranked grinders',
    query: 'valorant',
  },
  {
    title: 'League',
    subtitle: 'See top solo queue and pro-watch channels',
    query: 'league of legends',
  },
];

type SearchQuickAction = (typeof SEARCH_QUICK_ACTIONS)[number];

const isAndroid = process.env.EXPO_OS === 'android';

/**
 * Keeps row separators aligned with the text column, past the thumbnail.
 */
const RESULT_THUMBNAIL_WIDTH = 55;

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
    <Pressable
      accessibilityRole='button'
      onPress={onPress}
      android_ripple={
        isAndroid ? { color: 'rgba(255, 255, 255, 0.08)' } : undefined
      }
      style={({ pressed }) => [
        style,
        pressed && !isAndroid ? styles.rowPressed : null,
      ]}
    >
      {children}
    </Pressable>
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
    handleQuickActionPress,
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
          <View style={styles.categoryResultInfo}>
            <Text type='sm' weight='semibold' numberOfLines={1}>
              {item.name}
            </Text>
            <Text type='xs' color='gray.textLow' numberOfLines={1}>
              Open category
            </Text>
          </View>
        </ResultRow>
      );
    },
    [handleCategoryPress],
  );

  const renderQuickActionItem = useCallback(
    (item: SearchQuickAction) => {
      return (
        <Button
          key={item.query}
          haptic='selection'
          style={styles.quickActionChip}
          onPress={() => handleQuickActionPress(item.query)}
        >
          <Text type='sm' weight='semibold' style={styles.quickActionTitle}>
            {item.title}
          </Text>
        </Button>
      );
    },
    [handleQuickActionPress],
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
      <SearchHeader
        activeResults={activeResults}
        handleFilterChange={handleFilterChange}
        query={query}
        renderQuickActionItem={renderQuickActionItem}
        searchResultsLength={searchResults.length}
        selectedFilter={selectedFilter}
      />
      {showSearchHistory ? (
        <SearchHistory
          history={searchHistoryQueries}
          onClearAll={handleSearchHistoryClearAll}
          onSelectItem={handleSearchHistorySelect}
          onClearItem={handleSearchHistoryClearItem}
        />
      ) : null}
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
  renderQuickActionItem: (item: SearchQuickAction) => React.ReactElement;
  searchResultsLength: number;
  selectedFilter: SearchFilter;
};

function SearchHeader({
  activeResults,
  handleFilterChange,
  query,
  renderQuickActionItem,
  searchResultsLength,
  selectedFilter,
}: SearchHeaderProps) {
  return (
    <View style={styles.header}>
      <View style={styles.filterBar}>
        <SegmentedControl
          currentIndex={selectedFilter === 'channels' ? 0 : 1}
          onChange={handleFilterChange}
          items={[{ label: 'Channels' }, { label: 'Categories' }]}
        />
      </View>

      {query.length === 0 && searchResultsLength === 0 && (
        <View style={styles.quickActionsSection}>
          <View style={styles.sectionHeader}>
            <Text
              type='xs'
              weight='semibold'
              color='gray.textLow'
              style={styles.sectionTitle}
            >
              SUGGESTED
            </Text>
          </View>
          <View style={styles.quickActionsRow}>
            {SEARCH_QUICK_ACTIONS.map(renderQuickActionItem)}
          </View>
        </View>
      )}

      {query.length > 1 && activeResults.length > 0 && (
        <View style={styles.sectionHeader}>
          <Text
            type='xs'
            weight='semibold'
            color='gray.textLow'
            style={styles.sectionTitle}
          >
            {selectedFilter === 'channels' ? 'CHANNELS' : 'CATEGORIES'}
          </Text>
        </View>
      )}
    </View>
  );
}

function SearchResultsEmpty({
  onRetry,
  query,
  selectedFilter,
  status,
}: {
  onRetry: () => void;
  query: string;
  selectedFilter: SearchFilter;
  status: SearchStatus;
}) {
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
        button='Retry'
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
        button={null}
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
    borderColor: theme.colorBorderSecondary,
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius6,
    borderWidth: 1,
    height: 76,
    width: 54,
  },
  categoryResultInfo: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  categoryResultItem: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.space16,
    paddingHorizontal: theme.space16,
    paddingVertical: theme.space8,
  },
  container: {
    backgroundColor: theme.color.background.dark,
    flex: 1,
  },
  filterBar: {
    alignSelf: 'stretch',
  },
  listEmpty: {
    paddingTop: theme.space24,
  },
  header: {
    paddingHorizontal: theme.space16,
    paddingBottom: theme.space12,
    paddingTop: theme.space4,
  },
  quickActionChip: {
    backgroundColor: theme.colorSurfaceAlpha,
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius999,
    paddingHorizontal: theme.space16,
    paddingVertical: theme.space8,
  },
  quickActionTitle: {
    lineHeight: 20,
  },
  quickActionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.space8,
  },
  quickActionsSection: {
    marginTop: theme.space12,
  },
  resultItem: {
    flexDirection: 'row',
    paddingHorizontal: theme.space16,
    paddingVertical: theme.space8,
  },
  resultsList: {
    flex: 1,
  },
  rowPressed: {
    backgroundColor: theme.color.surfacePressed.dark,
  },
  separator: {
    backgroundColor: theme.color.border.dark,
    height: StyleSheet.hairlineWidth,
    marginStart: RESULT_SEPARATOR_INSET,
  },
  sectionHeader: {
    gap: 2,
    marginBottom: theme.space8,
    marginTop: theme.space12,
  },
  sectionTitle: {
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});
