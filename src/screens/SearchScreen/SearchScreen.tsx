import {
  Button,
  DismissableKeyboard,
  PressableArea,
  Screen,
  SearchHistory,
  TextField,
} from '@app/components';
import {
  useAppNavigation,
  useDebouncedCallback,
  useHeader,
  useDebouncedEffect,
} from '@app/hooks';
import {
  twitchService,
  SearchChannelResponse,
  storageService,
} from '@app/services';
import Entypo from '@expo/vector-icons/build/Entypo';
import * as ScreenOrientation from 'expo-screen-orientation';
import { useEffect, useRef, useState } from 'react';
import { FlatList, TextInput as NativeTextInput } from 'react-native';
import { createStyleSheet, useStyles } from 'react-native-unistyles';
import Feather from 'react-native-vector-icons/Feather';
import { StreamerCard } from './components';

interface SearchHistoryItem {
  query: string;
  date: string;
}

export function SearchScreen() {
  const { navigate } = useAppNavigation();
  const { styles, theme } = useStyles(stylesheet);
  const [query, setQuery] = useState<string>('');
  const ref = useRef<NativeTextInput | null>(null);
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const [searchResults, setSearchResults] = useState<SearchChannelResponse[]>(
    [],
  );

  void ScreenOrientation.lockAsync(
    ScreenOrientation.OrientationLock.PORTRAIT_UP,
  );

  useHeader({
    title: 'Search',
  });

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  const [search] = useDebouncedCallback(async (value: string) => {
    if (value.length < 2) {
      setSearchResults([]);
      // eslint-disable-next-line no-useless-return
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

  return (
    <Screen safeAreaEdges={['top', 'bottom', 'left']}>
      <FlatList
        showsVerticalScrollIndicator={false}
        data={searchResults}
        ListHeaderComponent={
          <DismissableKeyboard>
            <TextField
              ref={ref}
              placeholder="Find a channel"
              value={query}
              autoComplete="off"
              autoCorrect={false}
              // eslint-disable-next-line @typescript-eslint/no-misused-promises
              onChangeText={async text => handleQuery(text)}
              // eslint-disable-next-line react/no-unstable-nested-components
              RightAccessory={() =>
                query ? (
                  <PressableArea
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
                      color={theme.colors.border}
                    />
                  </PressableArea>
                ) : (
                  <Feather
                    name="search"
                    color={theme.colors.border}
                    size={22}
                    style={{
                      marginRight: 6,
                    }}
                  />
                )
              }
            />
          </DismissableKeyboard>
        }
        renderItem={({ item }) => (
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
        )}
      />
      {searchHistory && (
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
      )}
    </Screen>
  );
}

const stylesheet = createStyleSheet(theme => ({
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
}));
