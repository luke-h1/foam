import {
  DismissableKeyboard,
  PressableArea,
  Screen,
  SearchHistory,
  TextField,
  Typography,
} from '@app/components';
import { useAppNavigation, useDebouncedCallback, useHeader } from '@app/hooks';
import {
  twitchService,
  SearchChannelResponse,
  storageService,
} from '@app/services';
import Entypo from '@expo/vector-icons/build/Entypo';
import { useEffect, useRef, useState } from 'react';
import {
  FlatList,
  ScrollView,
  TouchableOpacity,
  TextInput as NativeTextInput,
  View,
} from 'react-native';
import { createStyleSheet, useStyles } from 'react-native-unistyles';
import Feather from 'react-native-vector-icons/Feather';
import { StreamerCard } from './components';

interface SearchHistoryItem {
  query: string;
  date: string;
}

export function SearchScreen() {
  const { navigate } = useAppNavigation();
  const { styles } = useStyles(stylesheet);
  const [query, setQuery] = useState<string>('');
  const ref = useRef<NativeTextInput | null>(null);
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const [searchResults, setSearchResults] = useState<SearchChannelResponse[]>(
    [],
  );

  useHeader({
    title: 'Search',
  });

  const fetchSearchHistory = async () => {
    const history =
      storageService.get<SearchHistoryItem[]>('previous_searches');

    history?.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
    setSearchHistory(history as SearchHistoryItem[]);
  };

  useEffect(() => {
    fetchSearchHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setTimeout(() => {
      fetchSearchHistory();
    }, 350);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const [search] = useDebouncedCallback(async (value: string) => {
    if (value.length < 2) {
      setSearchResults([]);
      // eslint-disable-next-line no-useless-return
      return;
    }

    const results = await twitchService.searchChannels(value);
    setSearchResults(results);

    const prevSearches =
      storageService.get<SearchHistoryItem[]>('previous_searches');

    // Check if the query already exists in the history
    const existingIndex = prevSearches?.findIndex(item => item.query === value);

    if (existingIndex !== -1) {
      // Update the date of the existing query
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      prevSearches[existingIndex].date = new Date().toISOString();
    } else {
      // Add the new query to the history
      prevSearches?.push({
        query: value,
        date: new Date().toISOString(),
      });
    }

    storageService.set('previous_searches', prevSearches);

    const prevSearchResults =
      storageService.get<SearchHistoryItem[]>('previous_searches');

    setSearchHistory(prevSearchResults as SearchHistoryItem[]);
  }, 400);

  // eslint-disable-next-line no-shadow
  const handleQuery = async (query: string) => {
    setQuery(query);
    await search(query);
  };

  return (
    <Screen safeAreaEdges={['top', 'bottom', 'left']} preset="scroll">
      <View style={styles.container}>
        <DismissableKeyboard>
          <ScrollView
            contentContainerStyle={{
              flexGrow: 1,
            }}
          >
            <TextField
              ref={ref}
              placeholder="Find a channel"
              value={query}
              autoComplete="off"
              autoCorrect={false}
              onChangeText={async text => handleQuery(text)}
              // eslint-disable-next-line react/no-unstable-nested-components
              RightAccessory={() =>
                query ? (
                  <PressableArea
                    onPress={() => {
                      setQuery?.('');
                      setSearchResults([]);
                      fetchSearchHistory();
                    }}
                    hitSlop={30}
                  >
                    <Entypo
                      name="circle-with-cross"
                      size={22}
                      style={{
                        marginRight: 6,
                      }}
                      // color={colors.border}
                    />
                  </PressableArea>
                ) : (
                  <Feather
                    name="search"
                    // color={colors.border}
                    size={22}
                    style={{
                      marginRight: 6,
                    }}
                  />
                )
              }
            />
          </ScrollView>
        </DismissableKeyboard>
      </View>

      <View style={styles.searchResultsWrapper}>
        {searchResults.length > 0 && (
          <>
            <Typography
              style={{
                marginBottom: 5,
              }}
            >
              Channels
            </Typography>
            <FlatList
              data={searchResults}
              renderItem={({ item }) => (
                <TouchableOpacity
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
                </TouchableOpacity>
              )}
            />
          </>
        )}
      </View>

      {searchHistory && (
        <SearchHistory
          results={searchHistory.map(item => item.query)}
          onClearAll={() => {
            setSearchHistory([]);
            storageService.remove('previous_searches');
          }}
          onSelectItem={q => {
            handleQuery(q);
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
  container: {
    flexDirection: 'row',
  },
  searchResultsWrapper: {
    marginTop: theme.spacing.md,
    marginLeft: theme.spacing.md,
    padding: theme.spacing.lg,
  },
  list: {
    flexDirection: 'row',
    padding: theme.spacing.md,
    alignContent: 'center',
    alignItems: 'center',
  },
}));
