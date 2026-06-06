import { AnimatedInputBar } from '@app/components/AnimatedInputBar/AnimatedInputBar';
import { Button } from '@app/components/Button/Button';
import { FlashList, FlashListRef } from '@app/components/FlashList/FlashList';
import { SymbolView } from 'expo-symbols';
import { Image } from '@app/components/Image/Image';
import { SegmentedControl } from '@app/components/SegmentedControl/SegmentedControl';
import { PressableArea } from '@app/components/PressableArea/PressableArea';
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
import { router } from 'expo-router';
import * as ScreenOrientation from 'expo-screen-orientation';
import { startTransition, useEffect, useReducer, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { StreamerCard } from './components/StreamerCard';
import { SearchQuickActionsRail } from './SearchQuickActionsRail';
import {
  initialSearchScreenState,
  searchScreenReducer,
  type SearchHistoryItem,
} from './searchScreenReducer';

type SearchItem = SearchChannelResponse | Category;

function isSearchChannelItem(item: SearchItem): item is SearchChannelResponse {
  return 'broadcaster_login' in item;
}

function getSearchResultKey(item: SearchItem) {
  return isSearchChannelItem(item)
    ? `channel-${item.id}`
    : `category-${item.id}`;
}

/**
 * Search screen with large title header style (like Settings)
 */
export function SearchScreen() {
  const [state, dispatch] = useReducer(
    searchScreenReducer,
    initialSearchScreenState,
  );
  const {
    categoryResults,
    query,
    searchHistory,
    searchResults,
    selectedFilter,
  } = state;
  const listRef = useRef<FlashListRef<SearchChannelResponse | Category>>(null);

  useScrollToTop(listRef);

  const fetchSearchHistory = () => {
    const history =
      storageService.getString<SearchHistoryItem[]>('previous_searches');

    if (history) {
      const sortedHistory = history
        .slice()
        .sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
        );
      startTransition(() => {
        dispatch({ type: 'setHistory', searchHistory: sortedHistory });
      });
      return;
    }
    startTransition(() => {
      dispatch({ type: 'setHistory', searchHistory: [] });
    });
  };

  useEffect(() => {
    void ScreenOrientation.lockAsync(
      ScreenOrientation.OrientationLock.PORTRAIT_UP,
    );
    void fetchSearchHistory();
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  const [search] = useDebouncedCallback(async (value: string) => {
    if (value.length < 2) {
      startTransition(() => {
        dispatch({ type: 'clearResults' });
      });
      return;
    }

    const [channelResults, categories] = await Promise.all([
      twitchService.searchChannels(value),
      twitchService.searchCategories(value),
    ]);

    startTransition(() => {
      dispatch({
        type: 'setResults',
        searchResults: channelResults,
        categoryResults: categories.data.slice(0, 10),
      });
    });

    const prevSearches =
      storageService.getString<SearchHistoryItem[]>('previous_searches') ?? [];

    /**
     * Check to see if we have an existing search term
     */
    const existingQuery = prevSearches.findIndex(item => item.query === value);

    if (existingQuery === -1) {
      /**
       * New query - add it to the list of results
       */
      prevSearches.push({
        query: value,
        date: new Date().toISOString(),
      });
    } else {
      /**
       * If we have an existing query
       * update the date so we can order it
       */
      if (prevSearches[existingQuery]) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        prevSearches[existingQuery].date = new Date().toISOString();
      }
    }

    storageService.set('previous_searches', prevSearches);
    startTransition(() => {
      dispatch({ type: 'setHistory', searchHistory: prevSearches });
    });
  }, 400);

  const handleClearSearch = () => {
    startTransition(() => {
      dispatch({ type: 'clearSearch' });
    });
  };

  const handleQuerySearch = async (searchQuery: string) => {
    await search(searchQuery);
  };

  const handleTextChange = (text: string) => {
    dispatch({ type: 'setQuery', query: text });
    if (text.length > 2) {
      void handleQuerySearch(text);
    } else if (text.length === 0) {
      startTransition(() => {
        dispatch({ type: 'clearResults' });
      });
    }
  };

  const handleSearchHistorySelect = (historyQuery: string) => {
    dispatch({ type: 'setQuery', query: historyQuery });
    void handleQuerySearch(historyQuery);
  };

  const handleSearchHistoryClearAll = () => {
    dispatch({ type: 'setHistory', searchHistory: [] });
    storageService.remove('previous_searches');
  };

  const handleSearchHistoryClearItem = (historyQuery: string) => {
    const newHistory = searchHistory.filter(
      item => item.query !== historyQuery,
    );
    dispatch({ type: 'setHistory', searchHistory: newHistory });
    storageService.set('previous_searches', newHistory);
  };

  const handleFilterChange = (index: number) => {
    startTransition(() => {
      dispatch({
        type: 'setFilter',
        selectedFilter: index === 0 ? 'channels' : 'categories',
      });
    });
  };

  const handleQuickActionPress = (actionQuery: string) => {
    dispatch({ type: 'setQuery', query: actionQuery });
    void handleQuerySearch(actionQuery);
  };

  const showRecentSearches = query.length === 0 && searchHistory.length > 0;
  const activeResults =
    selectedFilter === 'channels' ? searchResults : categoryResults;

  const recentSearchesSection = showRecentSearches ? (
    <SearchHistoryV2
      history={searchHistory.map(item => item.query)}
      onClearAll={handleSearchHistoryClearAll}
      onClearItem={handleSearchHistoryClearItem}
      onSelectItem={handleSearchHistorySelect}
    />
  ) : null;

  const ListHeaderComponent = (
    <View style={styles.header}>
      <Text type='4xl' weight='bold' style={styles.title}>
        Search
      </Text>
      <Text type='sm' color='gray.textLow' style={styles.subtitle}>
        Discover channels, categories, and live rooms.
      </Text>
      <View style={styles.searchBarContainer}>
        <View style={styles.searchBar}>
          <SymbolView
            name='magnifyingglass'
            size={16}
            tintColor={theme.colorGreyHoverAlpha}
            style={styles.searchIcon}
          />
          <AnimatedInputBar
            containerStyle={styles.searchInputShell}
            inputStyle={styles.searchInput}
            inputWrapperStyle={styles.searchInputWrapper}
            placeholderStyle={styles.searchPlaceholder}
            placeholders={['Search channels, games, or categories']}
            testID='search-input'
            value={query}
            onChangeText={handleTextChange}
            autoCapitalize='none'
            autoCorrect={false}
            returnKeyType='search'
          />
          {query.length > 0 && (
            <PressableArea
              onPress={handleClearSearch}
              style={styles.clearButton}
            >
              <View style={styles.clearIcon}>
                <SymbolView
                  name='xmark'
                  size={10}
                  tintColor={theme.colorGreyHoverAlpha}
                />
              </View>
            </PressableArea>
          )}
        </View>
      </View>

      {recentSearchesSection}

      <View style={styles.filterBar}>
        <SegmentedControl
          currentIndex={selectedFilter === 'channels' ? 0 : 1}
          onChange={handleFilterChange}
          items={[{ label: 'Channels' }, { label: 'Categories' }]}
        />
      </View>

      {query.length === 0 && searchResults.length === 0 ? (
        <SearchQuickActionsRail onQuickActionPress={handleQuickActionPress} />
      ) : null}

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
          <Text type='2xl' weight='bold' style={styles.sectionHeadline}>
            {selectedFilter === 'channels'
              ? 'Matching channels'
              : 'Matching categories'}
          </Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
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
        ListHeaderComponent={ListHeaderComponent}
        renderItem={
          selectedFilter === 'channels'
            ? (renderSearchChannelItem as ListRenderItem<
                SearchChannelResponse | Category
              >)
            : (renderSearchCategoryItem as ListRenderItem<
                SearchChannelResponse | Category
              >)
        }
        keyExtractor={getSearchResultKey}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  categoryResultImage: {
    borderColor: theme.colorBorderSecondary,
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius16,
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
  clearButton: {
    padding: theme.space8,
  },
  clearIcon: {
    alignItems: 'center',
    backgroundColor: theme.color.backgroundSecondary.dark,
    borderRadius: theme.borderRadius999,
    height: 18,
    justifyContent: 'center',
    width: 18,
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
  quickActionCard: {
    backgroundColor: theme.color.background.darkAlt,
    borderColor: theme.colorBorderSecondary,
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius20,
    borderWidth: 1,
    marginRight: theme.space16,
    minHeight: 104,
    paddingHorizontal: theme.space16,
    paddingVertical: theme.space16,
    width: 190,
  },
  quickActionSubtitle: {
    marginTop: theme.space8,
  },
  quickActionTitle: {
    lineHeight: 20,
  },
  quickActionsRail: {
    paddingHorizontal: 0,
  },
  quickActionsSection: {
    marginTop: theme.space20,
  },
  resultItem: {
    flexDirection: 'row',
    paddingHorizontal: theme.space20,
    paddingVertical: 6,
  },
  searchBar: {
    alignItems: 'center',
    backgroundColor: theme.color.background.darkAlt,
    borderColor: theme.colorBorderSecondary,
    borderCurve: 'continuous',
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: 44,
    paddingHorizontal: theme.space16,
  },
  searchBarContainer: {
    alignSelf: 'stretch',
  },
  searchIcon: {
    marginRight: theme.space8,
    opacity: 0.55,
  },
  searchInput: {
    color: theme.color.text.dark,
    flex: 1,
    fontSize: 16,
    paddingVertical: 0,
  },
  searchInputShell: {
    flex: 1,
    marginVertical: 0,
  },
  searchInputWrapper: {
    minHeight: 44,
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  searchPlaceholder: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 15,
  },
  sectionHeader: {
    gap: 2,
    marginBottom: theme.space12,
    marginTop: theme.space20,
  },
  sectionHeadline: {
    lineHeight: 28,
  },
  sectionTitle: {
    letterSpacing: 1,
  },
  subtitle: {
    marginBottom: theme.space16,
    maxWidth: 300,
  },
  title: {
    lineHeight: 44,
    marginBottom: 4,
  },
});

function navigateToSearchCategory(categoryId: string) {
  router.push(`/category/${categoryId}`);
}

const renderSearchChannelItem: ListRenderItem<SearchChannelResponse> = ({
  item,
}) => (
  <Button
    onPress={() => {
      router.push(`/streams/live-stream/${item.broadcaster_login}`);
    }}
    style={styles.resultItem}
  >
    <StreamerCard stream={item} />
  </Button>
);

const renderSearchCategoryItem: ListRenderItem<Category> = ({ item }) => {
  const imageUrl =
    item.box_art_url?.replace('{width}', '220')?.replace('{height}', '294') ??
    '';

  return (
    <Button
      onPress={() => navigateToSearchCategory(item.id)}
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
};
