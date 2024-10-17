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
import AsyncStorage from '@react-native-async-storage/async-storage';
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

export default function SearchScreen() {
  const [query, setQuery] = useState<string>('');
  const ref = useRef<NativeTextInput | null>(null);
  const [searchResults, setSearchResults] = useState<SearchChannelResponse[]>(
    [],
  );

  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  const fetchSearchHistory = async () => {
    const history = await AsyncStorage.getItem('previousSearches');
    setSearchHistory(JSON.parse(history as string));
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

    const prevSearches = await AsyncStorage.getItem('previousSearches');

    const newPrevSearches = Array.from(
      new Set(prevSearches ? JSON.parse(prevSearches) : []).add(value),
    );

    await AsyncStorage.setItem(
      'previousSearches',
      JSON.stringify(newPrevSearches),
    );
    const previousSearchResults =
      await AsyncStorage.getItem('previousSearches');
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
          results={searchHistory}
          onClearAll={() => {
            setSearchHistory([]);
            AsyncStorage.removeItem('previousSearches');
          }}
          onSelectItem={q => {
            setQuery(q);
            handleQuery(q);
          }}
          onClearItem={id => {
            const newHistory = searchHistory.filter(item => item !== id);
            setSearchHistory(newHistory);
            AsyncStorage.setItem(
              'previousSearches',
              JSON.stringify(newHistory),
            );
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
