import { Button } from '@app/components/Button/Button';
import { FlashList, FlashListRef } from '@app/components/FlashList/FlashList';
import { Image } from '@app/components/Image/Image';
import { SegmentedControl } from '@app/components/SegmentedControl/SegmentedControl';
import { SearchHistoryV2 } from '@app/components/ui/SearchHistory/SearchHistoryV2';
import { Text } from '@app/components/ui/Text/Text';
import { useDebouncedCallback } from '@app/hooks/useDebouncedCallback';
import { useScrollToTop } from '@app/hooks/useScrollToTop';
import { storageService } from '@app/lib/storage';
import {
  Category,
  SearchChannelResponse,
  twitchService,
} from '@app/services/twitch-service';
import { theme } from '@app/styles/themes';
import { ListRenderItem } from '@shopify/flash-list';
import { router, Stack } from 'expo-router';
import * as ScreenOrientation from 'expo-screen-orientation';
import {
  startTransition,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type RefObject,
} from 'react';
import {
  View,
  StyleSheet,
  type NativeSyntheticEvent,
  type TextInputFocusEventData,
} from 'react-native';
import type { SearchBarCommands } from 'react-native-screens';
import { StreamerCard } from './components/StreamerCard';

interface SearchHistoryItem {
  query: string;
  date: string;
}

type SearchFilter = 'channels' | 'categories';

const SEARCH_HISTORY_STORAGE_KEY = 'previous_searches';

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

type SearchItem = SearchChannelResponse | Category;
type SearchQuickAction = (typeof SEARCH_QUICK_ACTIONS)[number];

type SearchState = {
  query: string;
  selectedFilter: SearchFilter;
  searchResults: SearchChannelResponse[];
  categoryResults: Category[];
};

const SEARCH_INITIAL_STATE: SearchState = {
  query: '',
  selectedFilter: 'channels',
  searchResults: [],
  categoryResults: [],
};

function isSearchChannelItem(item: SearchItem): item is SearchChannelResponse {
  return 'broadcaster_login' in item;
}

function getSearchResultKey(item: SearchItem) {
  return isSearchChannelItem(item)
    ? `channel-${item.id}`
    : `category-${item.id}`;
}

function sortSearchHistory(history: SearchHistoryItem[]) {
  const sortedHistory: SearchHistoryItem[] = [];

  for (const item of history) {
    sortedHistory.push(item);
  }

  sortedHistory.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  return sortedHistory;
}

function getStoredSearchHistory() {
  return (
    storageService.getString<SearchHistoryItem[]>(SEARCH_HISTORY_STORAGE_KEY) ??
    []
  );
}

function getSearchHistorySnapshot() {
  return JSON.stringify(getStoredSearchHistory());
}

function subscribeToSearchHistory(onStoreChange: () => void) {
  const handleStorageChange = (key: string) => {
    if (key === SEARCH_HISTORY_STORAGE_KEY || key === 'all') {
      onStoreChange();
    }
  };

  storageService.events.on('storageChange', handleStorageChange);

  return () => {
    storageService.events.off('storageChange', handleStorageChange);
  };
}

function writeSearchHistoryQuery(query: string) {
  const previousSearches = getStoredSearchHistory();
  const updatedAt = new Date().toISOString();
  const nextSearches: SearchHistoryItem[] = [];
  let hasExistingQuery = false;

  for (const item of previousSearches) {
    if (item.query === query) {
      nextSearches.push({ query: item.query, date: updatedAt });
      hasExistingQuery = true;
      continue;
    }

    nextSearches.push(item);
  }

  if (!hasExistingQuery) {
    nextSearches.push({ query, date: updatedAt });
  }

  storageService.set(
    SEARCH_HISTORY_STORAGE_KEY,
    sortSearchHistory(nextSearches),
  );
}

export function SearchScreen() {
  const [{ query, selectedFilter, searchResults, categoryResults }, setState] =
    useState<SearchState>(SEARCH_INITIAL_STATE);
  const listRef = useRef<FlashListRef<SearchItem>>(null);
  const searchBarRef = useRef<SearchBarCommands | null>(null);

  useScrollToTop(listRef);

  const searchHistorySnapshot = useSyncExternalStore(
    subscribeToSearchHistory,
    getSearchHistorySnapshot,
    getSearchHistorySnapshot,
  );
  const searchHistory = useMemo(
    () =>
      sortSearchHistory(
        JSON.parse(searchHistorySnapshot) as SearchHistoryItem[],
      ),
    [searchHistorySnapshot],
  );
  const searchHistoryQueries = useMemo(
    () => searchHistory.map(item => item.query),
    [searchHistory],
  );

  useEffect(() => {
    void ScreenOrientation.lockAsync(
      ScreenOrientation.OrientationLock.PORTRAIT_UP,
    );
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  const [search] = useDebouncedCallback(async (value: string) => {
    if (value.length < 2) {
      startTransition(() => {
        setState(state => ({
          ...state,
          searchResults: [],
          categoryResults: [],
        }));
      });
      return;
    }

    const [channelResults, categories] = await Promise.all([
      twitchService.searchChannels(value),
      twitchService.searchCategories(value),
    ]);

    startTransition(() => {
      setState(state => ({
        ...state,
        searchResults: channelResults,
        categoryResults: categories.data.slice(0, 10),
      }));
    });

    writeSearchHistoryQuery(value);
  }, 400);

  const handleClearSearch = useCallback(() => {
    searchBarRef.current?.clearText();
    startTransition(() => {
      setState(state => ({
        ...state,
        query: '',
        searchResults: [],
        categoryResults: [],
      }));
    });
  }, []);

  const handleCategoryPress = useCallback((categoryId: string) => {
    router.push(`/category/${categoryId}`);
  }, []);

  const handleQuerySearch = useCallback(
    async (searchQuery: string) => {
      await search(searchQuery);
    },
    [search],
  );

  const handleTextChange = useCallback(
    (text: string) => {
      setState(state => ({ ...state, query: text }));
      if (text.length > 2) {
        void handleQuerySearch(text);
      } else if (text.length === 0) {
        startTransition(() => {
          setState(state => ({
            ...state,
            searchResults: [],
            categoryResults: [],
          }));
        });
      }
    },
    [handleQuerySearch],
  );

  const handleNativeSearchTextChange = useCallback(
    (event: NativeSyntheticEvent<TextInputFocusEventData>) => {
      handleTextChange(event.nativeEvent.text);
    },
    [handleTextChange],
  );

  const handleNativeSearchSubmit = useCallback(
    (event: NativeSyntheticEvent<TextInputFocusEventData>) => {
      const searchText = event.nativeEvent.text.trim();
      if (searchText.length > 0) {
        void handleQuerySearch(searchText);
      }
    },
    [handleQuerySearch],
  );

  const handleSearchHistorySelect = useCallback(
    (historyQuery: string) => {
      searchBarRef.current?.setText(historyQuery);
      setState(state => ({ ...state, query: historyQuery }));
      void handleQuerySearch(historyQuery);
    },
    [handleQuerySearch],
  );

  const handleSearchHistoryClearAll = useCallback(() => {
    storageService.remove(SEARCH_HISTORY_STORAGE_KEY);
  }, []);

  const handleSearchHistoryClearItem = useCallback(
    (historyQuery: string) => {
      const newHistory = searchHistory.filter(
        item => item.query !== historyQuery,
      );
      storageService.set(SEARCH_HISTORY_STORAGE_KEY, newHistory);
    },
    [searchHistory],
  );

  const handleFilterChange = useCallback((index: number) => {
    startTransition(() => {
      setState(state => ({
        ...state,
        selectedFilter: index === 0 ? 'channels' : 'categories',
      }));
    });
  }, []);

  const handleQuickActionPress = useCallback(
    (actionQuery: string) => {
      searchBarRef.current?.setText(actionQuery);
      setState(state => ({ ...state, query: actionQuery }));
      void handleQuerySearch(actionQuery);
    },
    [handleQuerySearch],
  );

  const activeResults =
    selectedFilter === 'channels' ? searchResults : categoryResults;

  const renderItem: ListRenderItem<SearchChannelResponse> = useCallback(
    ({ item }) => {
      return (
        <Button
          onPress={() => {
            router.push(`/streams/live-stream/${item.broadcaster_login}`);
          }}
          style={styles.resultItem}
        >
          <StreamerCard stream={item} />
        </Button>
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
        <Button
          onPress={() => handleCategoryPress(item.id)}
          style={styles.categoryResultItem}
        >
          <Image source={imageUrl} style={styles.categoryResultImage} />
          <View style={styles.categoryResultInfo}>
            <Text type='sm' weight='semibold' numberOfLines={1}>
              {item.name}
            </Text>
            <Text type='xs' color='gray.textLow' numberOfLines={1}>
              Open category
            </Text>
          </View>
        </Button>
      );
    },
    [handleCategoryPress],
  );

  const renderQuickActionItem = useCallback(
    (item: SearchQuickAction) => {
      return (
        <Button
          key={item.query}
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

  const showSearchHistory =
    searchResults.length === 0 && searchHistoryQueries.length > 0;

  return (
    <View style={styles.container}>
      <Stack.SearchBar
        ref={searchBarRef}
        autoCapitalize='none'
        hideWhenScrolling={false}
        onCancelButtonPress={handleClearSearch}
        onChangeText={handleNativeSearchTextChange}
        onClose={handleClearSearch}
        onSearchButtonPress={handleNativeSearchSubmit}
        placeholder='Search channels, games, or categories'
        placement='automatic'
      />
      <SearchHeader
        activeResults={activeResults}
        handleFilterChange={handleFilterChange}
        query={query}
        renderQuickActionItem={renderQuickActionItem}
        searchResultsLength={searchResults.length}
        selectedFilter={selectedFilter}
      />
      {showSearchHistory ? (
        <View style={styles.historyContainer}>
          <SearchHistoryV2
            history={searchHistoryQueries}
            onClearAll={handleSearchHistoryClearAll}
            onSelectItem={handleSearchHistorySelect}
            onClearItem={handleSearchHistoryClearItem}
          />
        </View>
      ) : null}
      <SearchResultsList
        activeResults={activeResults}
        listRef={listRef}
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

type SearchResultsListProps = {
  activeResults: SearchItem[];
  listRef: RefObject<FlashListRef<SearchItem> | null>;
  renderCategoryItem: ListRenderItem<Category>;
  renderItem: ListRenderItem<SearchChannelResponse>;
  selectedFilter: SearchFilter;
};

function SearchResultsList({
  activeResults,
  listRef,
  renderCategoryItem,
  renderItem,
  selectedFilter,
}: SearchResultsListProps) {
  return (
    <FlashList
      ref={listRef}
      getItemType={item =>
        isSearchChannelItem(item) ? 'search-channel' : 'search-category'
      }
      removeClippedSubviews
      showsVerticalScrollIndicator={false}
      contentInsetAdjustmentBehavior='automatic'
      data={activeResults}
      keyboardDismissMode='on-drag'
      keyboardShouldPersistTaps='handled'
      renderItem={
        selectedFilter === 'channels'
          ? (renderItem as ListRenderItem<SearchChannelResponse | Category>)
          : (renderCategoryItem as ListRenderItem<
              SearchChannelResponse | Category
            >)
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
    paddingHorizontal: theme.space20,
    paddingVertical: 6,
  },
  container: {
    backgroundColor: theme.color.background.dark,
    flex: 1,
  },
  filterBar: {
    alignSelf: 'stretch',
    marginTop: theme.space12,
  },
  header: {
    paddingHorizontal: theme.space20,
    paddingBottom: theme.space20,
    paddingTop: theme.space20,
  },
  historyContainer: {
    paddingHorizontal: theme.space20,
  },
  quickActionChip: {
    backgroundColor: theme.color.background.darkAlt,
    borderColor: theme.colorBorderSecondary,
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius10,
    borderWidth: 1,
    paddingHorizontal: theme.space12,
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
    marginTop: theme.space16,
  },
  resultItem: {
    flexDirection: 'row',
    paddingHorizontal: theme.space20,
    paddingVertical: 6,
  },
  resultsList: {
    flex: 1,
  },
  sectionHeader: {
    gap: 2,
    marginBottom: theme.space12,
    marginTop: theme.space20,
  },
  sectionTitle: {
    letterSpacing: 1,
  },
});
