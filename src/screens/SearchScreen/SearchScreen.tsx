import DismissableKeyboard from '@app/components/DismissableKeyboard';
import SearchHistory from '@app/components/SearchHistoryItem';
import { PressableArea } from '@app/components/form/PressableArea';
import Screen from '@app/components/ui/Screen';
import { Text } from '@app/components/ui/Text';
import { TextField } from '@app/components/ui/TextField';
import useAppNavigation from '@app/hooks/useAppNavigation';
import useDebouncedCallback from '@app/hooks/useDebouncedCallback';
import useHeader from '@app/hooks/useHeader';
import BackButton from '@app/navigators/BackButton';
import StreamerCard from '@app/screens/SearchScreen/components/StreamerCard';
import twitchService, {
  SearchChannelResponse,
} from '@app/services/twitchService';
import { colors, spacing } from '@app/styles';
import { statusBarHeight } from '@app/utils/statusBarHeight';
import { storage } from '@app/utils/storage';
import Entypo from '@expo/vector-icons/build/Entypo';
import { useEffect, useRef, useState } from 'react';
import {
  FlatList,
  ScrollView,
  TouchableOpacity,
  TextInput as NativeTextInput,
  View,
  ViewStyle,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';

const previousSearchesKey = 'previousSearches' as const;

interface SearchHistoryItem {
  query: string;
  date: string;
}

export default function SearchScreen() {
  const { navigate } = useAppNavigation();
  const [query, setQuery] = useState<string>('');
  const ref = useRef<NativeTextInput | null>(null);
  const [searchResults, setSearchResults] = useState<SearchChannelResponse[]>(
    [],
  );

  useHeader({
    title: 'Search',
    LeftActionComponent: <BackButton />,
  });

  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);

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
    <Screen
      style={$wrapper}
      safeAreaEdges={['top', 'bottom', 'left']}
      preset="scroll"
      contentContainerStyle={{
        padding: spacing.micro,
      }}
    >
      <View style={$container}>
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
                      size={24}
                      style={{
                        marginRight: 3,
                      }}
                      color={colors.border}
                    />
                  </PressableArea>
                ) : (
                  <Feather
                    name="search"
                    color={colors.border}
                    size={24}
                    style={{
                      marginRight: 3,
                    }}
                  />
                )
              }
            />
          </ScrollView>
        </DismissableKeyboard>
      </View>

      <View style={$searchResultsWrapper}>
        {searchResults.length > 0 && !!searchHistory.length && (
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
                    navigate('Streams', {
                      screen: 'LiveStream',
                      params: {
                        id: item.broadcaster_login,
                      },
                    });
                  }}
                  style={$list}
                >
                  <StreamerCard stream={item} />
                </TouchableOpacity>
              )}
            />
          </>
        )}
      </View>

      {searchHistory && !!searchResults && (
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

const $wrapper: ViewStyle = {
  flex: 1,
  paddingTop: statusBarHeight,
};

const $container: ViewStyle = {
  flexDirection: 'row',
  padding: 2,
};

const $searchResultsWrapper: ViewStyle = {
  marginBottom: 14,
  marginLeft: 14,
};

const $list: ViewStyle = {
  flexDirection: 'row',
  marginBottom: 14,
  marginLeft: 14,
  alignContent: 'center',
  alignItems: 'center',
};
