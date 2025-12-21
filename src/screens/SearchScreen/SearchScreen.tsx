import { Button } from '@app/components/Button';
import { FlashList } from '@app/components/FlashList';
import { Icon } from '@app/components/Icon';
import { PressableArea } from '@app/components/PressableArea';
import { SearchHistoryV2 } from '@app/components/SearchHistory';
import { Typography } from '@app/components/Typography';
import { useAppNavigation } from '@app/hooks/useAppNavigation';
import { useDebouncedCallback } from '@app/hooks/useDebouncedCallback';
import { useDebouncedEffect } from '@app/hooks/useDebouncedEffect';
import { storageService } from '@app/services/storage-service';
import {
  Category,
  SearchChannelResponse,
  twitchService,
} from '@app/services/twitch-service';
import { ListRenderItem } from '@shopify/flash-list';
// eslint-disable-next-line no-restricted-imports
import { Image } from 'expo-image';
import * as ScreenOrientation from 'expo-screen-orientation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, TextInput, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { StreamerCard } from './components';

interface SearchHistoryItem {
  query: string;
  date: string;
}

/**
 * Search screen with large title header style (like Settings)
 */
export function SearchScreen() {
  const { navigate } = useAppNavigation();
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
            navigate('Streams', {
              screen: 'LiveStream',
              params: {
                id: item.broadcaster_login,
              },
            });
          }}
          style={styles.resultItem}
        >
          <StreamerCard stream={item} />
        </Button>
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const handleFocus = useCallback(() => setIsFocused(true), []);
  const handleBlur = useCallback(() => setIsFocused(false), []);
  const handleCancel = useCallback(() => {
    inputRef.current?.blur();
    handleClearSearch();
  }, [handleClearSearch]);

  const handleCategoryPress = useCallback(
    (categoryId: string) => {
      navigate('Category', { id: categoryId });
    },
    [navigate],
  );

  const ListHeaderComponent = useMemo(
    () => (
      <View style={styles.header}>
        <Typography size="2xl" fontWeight="bold" style={styles.title}>
          Search
        </Typography>

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
              <Typography color="violet.accent">Cancel</Typography>
            </PressableArea>
          )}
        </View>

        {/* Categories carousel */}
        {categoryResults.length > 0 && (
          <View style={styles.categoriesSection}>
            <Typography
              size="xs"
              fontWeight="semiBold"
              color="gray.textLow"
              style={styles.sectionTitle}
            >
              CATEGORIES
            </Typography>
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
                  <Typography
                    size="xxs"
                    numberOfLines={2}
                    style={styles.categoryName}
                  >
                    {category.name}
                  </Typography>
                </PressableArea>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Channels section header */}
        {searchResults.length > 0 && (
          <View style={styles.sectionHeader}>
            <Typography
              size="xs"
              fontWeight="semiBold"
              color="gray.textLow"
              style={styles.sectionTitle}
            >
              CHANNELS
            </Typography>
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

const styles = StyleSheet.create(theme => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.gray.bg,
  },
  header: {
    paddingBottom: theme.spacing.sm,
  },
  title: {
    marginBottom: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.gray.ui,
    borderRadius: 10,
    paddingHorizontal: theme.spacing.sm,
    height: 36,
  },
  searchIcon: {
    opacity: 0.5,
    marginRight: theme.spacing.xs,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.gray.text,
    paddingVertical: 0,
  },
  clearButton: {
    padding: theme.spacing.xs,
  },
  clearIcon: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    paddingVertical: theme.spacing.xs,
  },
  categoriesSection: {
    marginTop: theme.spacing.lg,
  },
  categoriesCarousel: {
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.sm,
    gap: theme.spacing.md,
  },
  categoryCard: {
    width: 95,
    alignItems: 'center',
  },
  categoryImageContainer: {
    width: 95,
    height: 127,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: theme.colors.gray.ui,
  },
  categoryImage: {
    width: '100%',
    height: '100%',
  },
  categoryName: {
    marginTop: theme.spacing.xs,
    textAlign: 'center',
    lineHeight: 14,
  },
  sectionHeader: {
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
  },
  sectionTitle: {
    letterSpacing: 0.5,
    paddingHorizontal: theme.spacing.md,
  },
  resultItem: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
}));
