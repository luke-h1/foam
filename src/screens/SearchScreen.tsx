import DismissableKeyboard from '@app/components/DismissableKeyboard';
import LiveStreamMiniCard from '@app/components/LiveStreamMiniCard';
import SearchHistory from '@app/components/SearchHistoryItem';
import SearchInput from '@app/components/form/SearchInput';
import useDebouncedCallback from '@app/hooks/useDebouncedCallback';
import { HomeTabsParamList } from '@app/navigation/Home/HomeTabs';
import { StreamRoutes } from '@app/navigation/Stream/StreamStack';
import twitchService, {
  SearchChannelResponse,
} from '@app/services/twitchService';
import { statusBarHeight } from '@app/utils/statusBarHeight';
import { storage } from '@app/utils/storage';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { useEffect, useRef, useState } from 'react';
import {
  FlatList,
  ScrollView,
  TouchableOpacity,
  TextInput as NativeTextInput,
  View,
  Text,
  StyleSheet,
  ViewStyle,
  ImageStyle,
} from 'react-native';

const previousSearchesKey = 'previousSearches' as const;

interface SearchHistoryItem {
  query: string;
  date: string;
}

export default function SearchScreen() {
  const [query, setQuery] = useState<string>('');
  const ref = useRef<NativeTextInput | null>(null);
  const [searchResults, setSearchResults] = useState<SearchChannelResponse[]>(
    [],
  );

  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);

  const fetchSearchHistory = async () => {
    const history = storage.getString(previousSearchesKey) ?? '[]';
    const parsedHistory: SearchHistoryItem[] = JSON.parse(history);
    parsedHistory.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
    setSearchHistory(parsedHistory);
  };

  const { navigate } = useNavigation<NavigationProp<HomeTabsParamList>>();

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
    <View style={styles.wrapper}>
      <View style={styles.container}>
        <DismissableKeyboard>
          <ScrollView
            contentContainerStyle={{
              flexGrow: 1,
            }}
          >
            <SearchInput
              ref={ref}
              placeholder="Find a channel"
              value={query}
              onChangeText={async text => {
                await handleQuery(text);
              }}
            />
          </ScrollView>
        </DismissableKeyboard>
      </View>
      <View style={styles.searchResultsWrapper}>
        {searchResults.length > 0 && (
          <>
            <Text
              style={{
                marginBottom: 5,
              }}
            >
              Channels
            </Text>
            <FlatList
              data={searchResults}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => {
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-ignore FIX ME - navigation
                    navigate(StreamRoutes.LiveStream, {
                      screen: StreamRoutes.LiveStream,
                      params: {
                        id: item.broadcaster_login,
                      },
                    });
                  }}
                  style={styles.list}
                >
                  <LiveStreamMiniCard stream={item} />
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
    </View>
  );
}

const styles = StyleSheet.create<{
  wrapper: ViewStyle;
  container: ViewStyle;
  icon: ViewStyle;
  searchResultsWrapper: ViewStyle;
  list: ViewStyle;
  avatar: ImageStyle;
  elapsed: ViewStyle;
  history: ViewStyle;
}>({
  wrapper: {
    flex: 1,
    paddingTop: statusBarHeight,
  },
  container: {
    flexDirection: 'row',
    padding: 2,
  },
  icon: {
    alignSelf: 'center',
    marginRight: 15,
  },
  searchResultsWrapper: {
    marginBottom: 14,
    marginLeft: 14,
  },
  list: {
    flexDirection: 'row',
    marginBottom: 14,
    marginLeft: 14,
    alignContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    borderRadius: 20,
    marginRight: 1,
    width: 40,
    height: 40,
  },
  elapsed: {
    width: 10,
    height: 10,
    borderRadius: 25,
    backgroundColor: 'red',
    marginRight: 4,
  },
  history: {
    flex: 1,
    flexDirection: 'row',
    marginBottom: 12,
    paddingLeft: 14,
  },
});
