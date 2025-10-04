import { Button, FlashList, SearchBox, SearchHistoryV2 } from '@app/components';
import {
  useAppNavigation,
  useDebouncedCallback,
  useDebouncedEffect,
} from '@app/hooks';
import {
  twitchService,
  SearchChannelResponse,
  storageService,
} from '@app/services';
import { ListRenderItem } from '@shopify/flash-list';
import * as ScreenOrientation from 'expo-screen-orientation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Platform, View } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { StyleSheet, withUnistyles } from 'react-native-unistyles';
import { StreamerCard } from './components';

const UniKeyboardAvoidingView = withUnistyles(KeyboardAvoidingView);

interface SearchHistoryItem {
  query: string;
  date: string;
}
/**
 * TODO: use swipe to delete
 */
export function SearchScreen() {
  const { navigate } = useAppNavigation();

  const [query, setQuery] = useState<string>('');
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const [searchResults, setSearchResults] = useState<SearchChannelResponse[]>(
    [],
  );

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

      return;
    }

    const results = await twitchService.searchChannels(value);
    setSearchResults(results);

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

  const ListHeaderComponent = useMemo(() => {
    return (
      <UniKeyboardAvoidingView
        behavior="padding"
        style={styles.kb}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={styles.searchWrapper}>
          <SearchBox
            placeholder="search"
            value={query}
            onChange={handleTextChange}
            rightOnPress={handleClearSearch}
          />
        </View>
      </UniKeyboardAvoidingView>
    );
  }, [query, handleTextChange, handleClearSearch]);

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
          style={styles.list}
        >
          <StreamerCard stream={item} />
        </Button>
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  return (
    <FlashList
      showsVerticalScrollIndicator={false}
      contentInsetAdjustmentBehavior="automatic"
      data={searchResults}
      style={{ flex: 1 }}
      ListFooterComponent={ListFooterComponent}
      ListHeaderComponent={ListHeaderComponent}
      renderItem={renderItem}
    />
  );
}

const styles = StyleSheet.create(theme => ({
  searchResultsWrapper: {
    marginTop: theme.spacing.md,
    marginLeft: theme.spacing.md,
  },
  list: {
    flexDirection: 'row',
    padding: theme.spacing.md,
    alignContent: 'center',
    alignItems: 'center',
  },
  kb: {
    paddingHorizontal: theme.spacing.md,
  },
  searchWrapper: {
    flexDirection: 'row',
  },
}));
