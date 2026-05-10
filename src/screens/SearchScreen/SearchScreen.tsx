import { AnimatedInputBar } from '@app/components/AnimatedInputBar/AnimatedInputBar';
import { Button } from '@app/components/Button/Button';
import { FlashList, FlashListRef } from '@app/components/FlashList/FlashList';
import { Icon } from '@app/components/Icon/Icon';
import { Image } from '@app/components/Image/Image';
import { SegmentedControl } from '@app/components/SegmentedControl/SegmentedControl';
import { PressableArea } from '@app/components/PressableArea/PressableArea';
import { SearchHistoryV2 } from '@app/components/SearchHistory/SearchHistoryV2';
import { Text } from '@app/components/Text/Text';
import { useDebouncedCallback } from '@app/hooks/useDebouncedCallback';
import { useScrollToTop } from '@app/hooks/useScrollToTop';
import { storageService } from '@app/services/storage-service';
import {
  Category,
  SearchChannelResponse,
  twitchService,
} from '@app/services/twitch-service';
import { theme } from '@app/styles/themes';
import { ListRenderItem } from '@shopify/flash-list';
import { router } from 'expo-router';
import * as ScreenOrientation from 'expo-screen-orientation';
import {
  startTransition,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Keyboard, ScrollView, View, StyleSheet } from 'react-native';
import { StreamerCard } from './components/StreamerCard';

interface SearchHistoryItem {
  query: string;
  date: string;
}

type SearchFilter = 'channels' | 'categories';

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

/**
 * Search screen with large title header style (like Settings)
 */
export function SearchScreen() {
  const [query, setQuery] = useState<string>('');
  const [isFocused, setIsFocused] = useState(false);
  const [selectedFilter, setSelectedFilter] =
    useState<SearchFilter>('channels');
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const [searchResults, setSearchResults] = useState<SearchChannelResponse[]>(
    [],
  );
  const [categoryResults, setCategoryResults] = useState<Category[]>([]);
  const listRef = useRef<FlashListRef<SearchChannelResponse | Category>>(null);

  useScrollToTop(listRef);

  const fetchSearchHistory = useCallback(() => {
    const history =
      storageService.getString<SearchHistoryItem[]>('previous_searches');

    if (history) {
      history.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      );
      startTransition(() => {
        setSearchHistory(history);
      });
      return;
    }
    startTransition(() => {
      setSearchHistory([]);
    });
  }, []);

  useEffect(() => {
    void ScreenOrientation.lockAsync(
      ScreenOrientation.OrientationLock.PORTRAIT_UP,
    );
    fetchSearchHistory();
  }, [fetchSearchHistory]);

  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  const [search] = useDebouncedCallback(async (value: string) => {
    if (value.length < 2) {
      startTransition(() => {
        setSearchResults([]);
        setCategoryResults([]);
      });
      return;
    }

    const [channelResults, categories] = await Promise.all([
      twitchService.searchChannels(value),
      twitchService.searchCategories(value),
    ]);

    startTransition(() => {
      setSearchResults(channelResults);
      setCategoryResults(categories.data.slice(0, 10));
    });

    const prevSearches =
      storageService.getString<SearchHistoryItem[]>('previous_searches') ?? [];

    /**
     * Check to see if we have an existing search term
     */
    const existingQuery = prevSearches.findIndex(item => item.query === value);

    if (existingQuery !== -1) {
      /**
       * If we have an existing query
       * update the date so we can order it
       */
      if (prevSearches[existingQuery]) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        prevSearches[existingQuery].date = new Date().toISOString();
      }
    } else {
      /**
       * New query - add it to the list of results
       */
      prevSearches.push({
        query: value,
        date: new Date().toISOString(),
      });
    }

    storageService.set('previous_searches', prevSearches);
    startTransition(() => {
      setSearchHistory(prevSearches);
    });
  }, 400);

  const handleClearSearch = useCallback(() => {
    setQuery('');
    setSearchResults([]);
    setCategoryResults([]);
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
      setQuery(text);
      if (text.length > 2) {
        void handleQuerySearch(text);
      } else if (text.length === 0) {
        setSearchResults([]);
        setCategoryResults([]);
      }
    },
    [handleQuerySearch],
  );

  const historySection = useMemo(() => {
    return searchResults.length === 0 && searchHistory.length > 0 ? (
      <SearchHistoryV2
        history={searchHistory.map(item => item.query)}
        onClearAll={() => {
          setSearchHistory([]);
          storageService.remove('previous_searches');
        }}
        onSelectItem={q => {
          setQuery(q);
          void handleQuerySearch(q);
        }}
        onClearItem={id => {
          const newHistory = searchHistory.filter(item => item.query !== id);
          setSearchHistory(newHistory);
          storageService.set('previous_searches', newHistory);
        }}
      />
    ) : null;
  }, [searchResults.length, searchHistory, handleQuerySearch]);

  const ListFooterComponent = useMemo(() => {
    return historySection;
  }, [historySection]);

  const activeResults = useMemo(
    () => (selectedFilter === 'channels' ? searchResults : categoryResults),
    [categoryResults, searchResults, selectedFilter],
  );

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
            <Text type="sm" weight="semibold" numberOfLines={1}>
              {item.name}
            </Text>
            <Text type="xs" color="gray.textLow" numberOfLines={1}>
              Open category
            </Text>
          </View>
        </Button>
      );
    },
    [handleCategoryPress],
  );

  const handleFocus = useCallback(() => setIsFocused(true), []);
  const handleBlur = useCallback(() => setIsFocused(false), []);
  const handleCancel = useCallback(() => {
    Keyboard.dismiss();
    setIsFocused(false);
    handleClearSearch();
  }, [handleClearSearch]);

  const ListHeaderComponent = useMemo(
    () => (
      <View style={styles.header}>
        <Text type="5xl" variant="display" style={styles.title}>
          Search
        </Text>
        <Text type="sm" color="gray.textLow" style={styles.subtitle}>
          Discover channels, categories, and live rooms.
        </Text>
        <View style={styles.searchBarContainer}>
          <View style={styles.searchBar}>
            <Icon icon="search" size={16} style={styles.searchIcon} />
            <AnimatedInputBar
              containerStyle={styles.searchInputShell}
              inputStyle={styles.searchInput}
              inputWrapperStyle={styles.searchInputWrapper}
              placeholderStyle={styles.searchPlaceholder}
              placeholders={['Search channels, games, or categories']}
              testID="search-input"
              value={query}
              onChangeText={handleTextChange}
              onFocus={handleFocus}
              onBlur={handleBlur}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
            />
            {query.length > 0 && (
              <PressableArea
                onPress={handleClearSearch}
                style={styles.clearButton}
              >
                <View style={styles.clearIcon}>
                  <Icon icon="x" size={10} />
                </View>
              </PressableArea>
            )}
          </View>
          {isFocused && (
            <PressableArea onPress={handleCancel} style={styles.cancelButton}>
              <Text color="accent.accent" weight="semibold">
                Cancel
              </Text>
            </PressableArea>
          )}
        </View>

        <View style={styles.filterBar}>
          <SegmentedControl
            currentIndex={selectedFilter === 'channels' ? 0 : 1}
            onChange={index =>
              setSelectedFilter(index === 0 ? 'channels' : 'categories')
            }
            items={[{ label: 'Channels' }, { label: 'Categories' }]}
          />
        </View>

        {query.length === 0 && searchResults.length === 0 && (
          <View style={styles.quickActionsSection}>
            <View style={styles.sectionHeader}>
              <Text
                type="xs"
                weight="semibold"
                color="gray.textLow"
                style={styles.sectionTitle}
              >
                START WITH
              </Text>
              <Text type="2xl" variant="display" style={styles.sectionHeadline}>
                Quick routes
              </Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.quickActionsRail}
            >
              {SEARCH_QUICK_ACTIONS.map(item => (
                <Button
                  key={item.query}
                  style={styles.quickActionCard}
                  onPress={() => {
                    setQuery(item.query);
                    void handleQuerySearch(item.query);
                  }}
                >
                  <Text
                    type="sm"
                    weight="semibold"
                    style={styles.quickActionTitle}
                  >
                    {item.title}
                  </Text>
                  <Text
                    type="xs"
                    color="gray.textLow"
                    style={styles.quickActionSubtitle}
                  >
                    {item.subtitle}
                  </Text>
                </Button>
              ))}
            </ScrollView>
          </View>
        )}

        {query.length > 1 && activeResults.length > 0 && (
          <View style={styles.sectionHeader}>
            <Text
              type="xs"
              weight="semibold"
              color="gray.textLow"
              style={styles.sectionTitle}
            >
              {selectedFilter === 'channels' ? 'CHANNELS' : 'CATEGORIES'}
            </Text>
            <Text type="2xl" variant="display" style={styles.sectionHeadline}>
              {selectedFilter === 'channels'
                ? 'Matching channels'
                : 'Matching categories'}
            </Text>
          </View>
        )}
      </View>
    ),
    [
      query,
      selectedFilter,
      activeResults.length,
      searchResults.length,
      handleTextChange,
      handleQuerySearch,
      handleFocus,
      handleBlur,
      handleClearSearch,
      handleCancel,
      isFocused,
    ],
  );

  return (
    <View style={styles.container}>
      <FlashList
        ref={listRef}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
        data={activeResults}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        ListFooterComponent={ListFooterComponent}
        ListHeaderComponent={ListHeaderComponent}
        renderItem={
          selectedFilter === 'channels'
            ? (renderItem as ListRenderItem<SearchChannelResponse | Category>)
            : (renderCategoryItem as ListRenderItem<
                SearchChannelResponse | Category
              >)
        }
        keyExtractor={item => item.id}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  cancelButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: theme.space8,
  },
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
    flex: 1,
    flexDirection: 'row',
    minHeight: 44,
    paddingHorizontal: theme.space16,
  },
  searchBarContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.space8,
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
