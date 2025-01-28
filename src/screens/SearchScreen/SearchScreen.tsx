import {
  DismissableKeyboard,
  PressableArea,
  Screen,
  SearchHistory,
  TextField,
  Typography,
} from '@app/components';
import { useAppNavigation, useDebouncedCallback, useHeader } from '@app/hooks';
import { twitchService, SearchChannelResponse } from '@app/services';
import { storage } from '@app/utils';
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

const previousSearchesKey = 'previousSearches' as const;

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
    const history = storage.getString(previousSearchesKey) ?? '[]';
    const parsedHistory: SearchHistoryItem[] = JSON.parse(history);
    parsedHistory.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
    setSearchHistory(parsedHistory);
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

    const prevSearches = storage.getString(previousSearchesKey);
    const parsedPrevSearches: SearchHistoryItem[] = prevSearches
      ? JSON.parse(prevSearches)
      : [];

    // Check if the query already exists in the history
    const existingIndex = parsedPrevSearches.findIndex(
      item => item.query === value,
    );

    if (existingIndex !== -1) {
      // Update the date of the existing query
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      parsedPrevSearches[existingIndex].date = new Date().toISOString();
    } else {
      // Add the new query to the history
      parsedPrevSearches.push({
        query: value,
        date: new Date().toISOString(),
      });
    }

    storage.set(previousSearchesKey, JSON.stringify(parsedPrevSearches));

    const previousSearchResults = storage.getString(previousSearchesKey);

    setSearchHistory(JSON.parse(previousSearchResults as string));
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
            storage.delete(previousSearchesKey);
          }}
          onSelectItem={q => {
            handleQuery(q);
          }}
          onClearItem={id => {
            const newHistory = searchHistory.filter(item => item.query !== id);
            setSearchHistory(newHistory);
            storage.set(previousSearchesKey, JSON.stringify(newHistory));
          }}
        />
      )}
    </Screen>
  );
}

const stylesheet = createStyleSheet(theme => ({
  container: {
    flexDirection: 'row',
    padding: 2,
  },
  searchResultsWrapper: {
    marginTop: theme.spacing.md,
    marginLeft: theme.spacing.md,
  },
  list: {
    flexDirection: 'row',
    padding: 6,
    alignContent: 'center',
    alignItems: 'center',
  },
}));
