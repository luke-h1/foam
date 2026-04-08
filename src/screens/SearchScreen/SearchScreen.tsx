import { Button } from '@app/components/Button/Button';
import { FlashList } from '@app/components/FlashList/FlashList';
import { Icon } from '@app/components/Icon/Icon';
import { PressableArea } from '@app/components/PressableArea/PressableArea';
import { SearchHistoryV2 } from '@app/components/SearchHistory/SearchHistoryV2';
import { Text } from '@app/components/Text/Text';
import { useAppNavigation } from '@app/hooks/useAppNavigation';
import { useDebouncedCallback } from '@app/hooks/useDebouncedCallback';
import { useDebouncedEffect } from '@app/hooks/useDebouncedEffect';
import { storageService } from '@app/services/storage-service';
import {
  Category,
  SearchChannelResponse,
  twitchService,
} from '@app/services/twitch-service';
import { theme } from '@app/styles/themes';
import { ListRenderItem } from '@shopify/flash-list';
// eslint-disable-next-line no-restricted-imports
import { Image } from 'expo-image';
import * as ScreenOrientation from 'expo-screen-orientation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, TextInput, View, StyleSheet } from 'react-native';
import { StreamerCard } from './components/StreamerCard';

interface SearchHistoryItem {
  query: string;
  date: string;
}

/**
 * Search screen with large title header style (like Settings)
 */
export function SearchScreen() {
  const navigation = useAppNavigation();
  const inputRef = useRef<TextInput>(null);

  const [query, setQuery] = useState<string>('');
  const [isFocused, setIsFocused] = useState(false);
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const [searchResults, setSearchResults] = useState<SearchChannelResponse[]>(
    [],
  );
  const [categoryResults, setCategoryResults] = useState<Category[]>([]);

  void ScreenOrientation.lockAsync(
    ScreenOrientation.OrientationLock.PORTRAIT_UP,
  );

  const fetchSearchHistory = () => {
    const history =
      storageService.getString<SearchHistoryItem[]>('previous_searches');

    if (history) {
      history?.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      );
      setSearchHistory(history);
    }
  };

  useDebouncedEffect(fetchSearchHistory, 300);

  useEffect(() => {
    void fetchSearchHistory();
  }, [query]);

  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  const [search] = useDebouncedCallback(async (value: string) => {
    if (value.length < 2) {
      setSearchResults([]);
      setCategoryResults([]);
      return;
    }

    const [channelResults, categories] = await Promise.all([
      twitchService.searchChannels(value),
      twitchService.searchCategories(value),
    ]);

    setSearchResults(channelResults);
    setCategoryResults(categories.data.slice(0, 10));

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
    setSearchHistory(prevSearches);
  }, 400);

  const handleClearSearch = useCallback(() => {
    setQuery('');
    setSearchResults([]);
    setCategoryResults([]);
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

  const ListFooterComponent = useMemo(() => {
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

  const renderItem: ListRenderItem<SearchChannelResponse> = useCallback(
    ({ item }) => {
      return (
        <Button
          onPress={() => {
            navigation.navigate('Streams', {
              screen: 'LiveStream',
              params: { id: item.broadcaster_login },
            });
          }}
          onPressIn={() => {
            navigation.preload('Streams', {
              screen: 'LiveStream',
              params: { id: item.broadcaster_login },
            });
          }}
          style={styles.resultItem}
        >
          <StreamerCard stream={item} />
        </Button>
      );
    },
    [navigation],
  );

  const handleFocus = useCallback(() => setIsFocused(true), []);
  const handleBlur = useCallback(() => setIsFocused(false), []);
  const handleCancel = useCallback(() => {
    inputRef.current?.blur();
    handleClearSearch();
  }, [handleClearSearch]);

  const handleCategoryPress = useCallback(
    (categoryId: string) => {
      navigation.navigate('Category', { id: categoryId });
    },
    [navigation],
  );

  const ListHeaderComponent = useMemo(
    () => (
      <View style={styles.header}>
        <View style={styles.searchBarContainer}>
          <View style={styles.searchBar}>
            <Icon icon="search" size={16} style={styles.searchIcon} />
            <TextInput
              ref={inputRef}
              style={styles.searchInput}
              placeholder="Channels, categories..."
              placeholderTextColor="rgba(255,255,255,0.4)"
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
                  <Icon icon="x" size={12} />
                </View>
              </PressableArea>
            )}
          </View>
          {isFocused && (
            <PressableArea onPress={handleCancel} style={styles.cancelButton}>
              <Text color="violet.accent">Cancel</Text>
            </PressableArea>
          )}
        </View>

        {/* Categories carousel */}
        {categoryResults.length > 0 && (
          <View style={styles.categoriesSection}>
            <Text
              type="xs"
              weight="semibold"
              color="gray.textLow"
              style={styles.sectionTitle}
            >
              CATEGORIES
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoriesCarousel}
            >
              {categoryResults.map(category => (
                <PressableArea
                  key={category.id}
                  onPress={() => handleCategoryPress(category.id)}
                  style={styles.categoryCard}
                >
                  <View style={styles.categoryImageContainer}>
                    <Image
                      source={category.box_art_url
                        ?.replace('{width}', '285')
                        ?.replace('{height}', '380')}
                      style={styles.categoryImage}
                    />
                  </View>
                  <Text
                    type="xxs"
                    numberOfLines={2}
                    style={styles.categoryName}
                  >
                    {category.name}
                  </Text>
                </PressableArea>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Channels section header */}
        {searchResults.length > 0 && (
          <View style={styles.sectionHeader}>
            <Text
              type="xs"
              weight="semibold"
              color="gray.textLow"
              style={styles.sectionTitle}
            >
              CHANNELS
            </Text>
          </View>
        )}
      </View>
    ),
    [
      query,
      handleTextChange,
      handleFocus,
      handleBlur,
      handleClearSearch,
      handleCancel,
      isFocused,
      categoryResults,
      handleCategoryPress,
      searchResults.length,
    ],
  );

  return (
    <View style={styles.container}>
      <FlashList
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
        data={searchResults}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        ListFooterComponent={ListFooterComponent}
        ListHeaderComponent={ListHeaderComponent}
        renderItem={renderItem}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  cancelButton: {
    paddingVertical: theme.spacing.xs,
  },
  categoriesCarousel: {
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.sm,
  },
  categoriesSection: {
    marginTop: theme.spacing.lg,
  },
  categoryCard: {
    alignItems: 'center',
    width: 95,
  },
  categoryImage: {
    height: '100%',
    width: '100%',
  },
  categoryImageContainer: {
    backgroundColor: theme.colors.gray.ui,
    borderCurve: 'continuous',
    borderRadius: 8,
    height: 127,
    overflow: 'hidden',
    width: 95,
  },
  categoryName: {
    lineHeight: 14,
    marginTop: theme.spacing.xs,
    textAlign: 'center',
  },
  clearButton: {
    padding: theme.spacing.xs,
  },
  clearIcon: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8,
    height: 16,
    justifyContent: 'center',
    width: 16,
  },
  container: {
    backgroundColor: theme.colors.gray.bg,
    flex: 1,
  },
  header: {
    paddingBottom: theme.spacing.sm,
  },
  resultItem: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  searchBar: {
    alignItems: 'center',
    backgroundColor: theme.colors.gray.ui,
    borderCurve: 'continuous',
    borderRadius: 10,
    flex: 1,
    flexDirection: 'row',
    height: 36,
    paddingHorizontal: theme.spacing.sm,
  },
  searchBarContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
  },
  searchIcon: {
    marginRight: theme.spacing.xs,
    opacity: 0.5,
  },
  searchInput: {
    color: theme.colors.gray.text,
    flex: 1,
    fontSize: 16,
    paddingVertical: 0,
  },
  sectionHeader: {
    marginBottom: theme.spacing.xs,
    marginTop: theme.spacing.lg,
    paddingHorizontal: theme.spacing.md,
  },
  sectionTitle: {
    letterSpacing: 0.5,
    paddingHorizontal: theme.spacing.md,
  },
});
