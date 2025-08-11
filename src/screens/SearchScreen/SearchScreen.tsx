import { Button, SearchHistory, TextField, FlashList } from '@app/components';
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
import Entypo from '@expo/vector-icons/build/Entypo';
import { ListRenderItem } from '@shopify/flash-list';
import * as ScreenOrientation from 'expo-screen-orientation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { TextInput as NativeTextInput, Platform } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import {
  StyleSheet,
  useUnistyles,
  withUnistyles,
} from 'react-native-unistyles';
import Feather from 'react-native-vector-icons/Feather';
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
  const ref = useRef<NativeTextInput | null>(null);
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

  // eslint-disable-next-line no-shadow
  const handleQuery = async (query: string) => {
    setQuery(query);
    await search(query);
  };
  const { theme } = useUnistyles();

  const ListFooterComponent = useCallback(() => {
    return searchResults.length === 0 ? (
      <SearchHistory
        results={searchHistory.map(item => item.query)}
        onClearAll={() => {
          setSearchHistory([]);
          storageService.remove('previous_searches');
        }}
        onSelectItem={q => {
          void handleQuery(q);
        }}
        onClearItem={id => {
          const newHistory = searchHistory.filter(item => item.query !== id);
          setSearchHistory(newHistory);
          storageService.set('previous_searches', newHistory);
        }}
      />
    ) : null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ListHeaderComponent = useCallback(() => {
    return (
      <UniKeyboardAvoidingView
        behavior="padding"
        style={styles.kb}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <TextField
          ref={ref}
          placeholder="Find a channel"
          value={query}
          autoCorrect={false}
          // eslint-disable-next-line @typescript-eslint/no-misused-promises
          onChangeText={async text => handleQuery(text)}
          // eslint-disable-next-line react/no-unstable-nested-components
          RightAccessory={() =>
            query ? (
              <Button
                onPress={() => {
                  setQuery?.('');
                  setSearchResults([]);
                  void fetchSearchHistory();
                }}
                hitSlop={30}
              >
                <Entypo
                  name="circle-with-cross"
                  size={22}
                  style={{
                    marginRight: 6,
                  }}
                  color={theme.colors.gray.accent}
                />
              </Button>
            ) : (
              <Feather
                name="search"
                color={theme.colors.gray.accent}
                size={22}
                style={{
                  marginRight: 6,
                }}
              />
            )
          }
        />
      </UniKeyboardAvoidingView>
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      estimatedItemSize={100}
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
}));
