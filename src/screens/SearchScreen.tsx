/* eslint-disable no-console */
import DismissableKeyboard from '@app/components/DismissableKeyboard';
import { TextInput } from '@app/components/TextInput';
import useDebouncedCallback from '@app/hooks/useDebouncedCallback';
import { HomeTabsParamList } from '@app/navigation/Home/HomeTabs';
import { StreamRoutes } from '@app/navigation/Stream/StreamStack';
import twitchService, {
  SearchChannelResponse,
} from '@app/services/twitchService';
import elapsedStreamTime from '@app/utils/elapsedStreamTime';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { X, Search, History } from '@tamagui/lucide-icons';
import { useEffect, useRef, useState } from 'react';
import {
  FlatList,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput as NativeTextInput,
} from 'react-native';
import { Stack, View } from 'tamagui';
import Image from '../components/Image';
import { Text } from '../components/Text';
import { statusBarHeight } from './FollowingScreen';

interface SearchHistoryItem {
  date: Date;
  query: string;
}

const SearchScreen = () => {
  const [query, setQuery] = useState<string>('');
  const ref = useRef<NativeTextInput | null>(null);
  const [searchResults, setSearchResults] = useState<SearchChannelResponse[]>(
    [],
  );
  const [showDismiss, setShowDismiss] = useState<boolean>(false);
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);

  const fetchSearchHistory = async () => {
    const res = await AsyncStorage.getItem('previousSearches');
    setSearchHistory(JSON.parse(res as string));
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
    setShowDismiss(true);

    const prevSearches = await AsyncStorage.getItem('previousSearches');
    const searchItem: SearchHistoryItem = {
      query: value,
      date: new Date(),
    };

    const newPrevSearches = Array.from(
      new Set(prevSearches ? JSON.parse(prevSearches) : []).add(searchItem),
    );

    await AsyncStorage.setItem(
      'previousSearches',
      JSON.stringify(newPrevSearches),
    );
    const res = await AsyncStorage.getItem('previousSearches');
    setSearchHistory(JSON.parse(res as string));
  }, 400);

  // eslint-disable-next-line no-shadow
  const handleQuery = async (query: string) => {
    setQuery(query);
    await search(query);
    setShowDismiss(true);
  };

  return (
    <SafeAreaView
      style={{
        flex: 1,
        paddingTop: statusBarHeight,
      }}
    >
      <Stack flexDirection="row" padding={2}>
        <DismissableKeyboard>
          <ScrollView
            contentContainerStyle={{
              flexGrow: 1,
            }}
          >
            <SafeAreaView style={{ flexDirection: 'row' }}>
              <TextInput
                ref={ref}
                placeholder="Find a channel"
                placeholderTextColor="$text"
                verticalAlign="middle"
                onChangeText={async text => {
                  await handleQuery(text);
                }}
              />
            </SafeAreaView>
          </ScrollView>
        </DismissableKeyboard>
        {showDismiss ? (
          <X
            size={24}
            style={[{ alignSelf: 'center', marginRight: 15 }]}
            onPress={() => {
              setSearchResults([]);
              setQuery('');
              setShowDismiss(false);
              ref?.current?.clear();
            }}
          />
        ) : (
          <Search
            size={24}
            style={{ alignSelf: 'center', marginRight: 25 }}
            onPress={() => search(query)}
          />
        )}
      </Stack>
      <Stack marginBottom={14} marginLeft={14}>
        {searchResults.length > 0 && (
          <>
            <Text variant="heading3" marginBottom={5}>
              Channels
            </Text>
            <FlatList
              data={searchResults}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => {
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-ignore
                    navigate(StreamRoutes.LiveStream, {
                      screen: StreamRoutes.LiveStream,
                      params: {
                        id: item.broadcaster_login,
                      },
                    });
                  }}
                  style={{
                    flexDirection: 'row',
                    marginBottom: 14,
                    marginLeft: 14,
                    alignContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <Image
                    source={{
                      uri: item.thumbnail_url
                        .replace('{width}', '40')
                        .replace('{height}', '40'),
                    }}
                    style={{
                      borderRadius: 20,
                      marginRight: 5,
                      width: 40,
                      height: 40,
                    }}
                  />
                  <Text style={{ marginLeft: 8 }} color="$color">
                    {item.display_name}
                  </Text>
                  {item.is_live && (
                    <View
                      style={{
                        marginLeft: 8,
                        flex: 1,
                        flexDirection: 'row',
                        alignItems: 'center',
                      }}
                    >
                      <View
                        borderColor="$color"
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: 4,
                          marginRight: 5,
                        }}
                      />
                      <Text color="$text">
                        {elapsedStreamTime(item.started_at)}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              )}
            />
          </>
        )}
      </Stack>

      {searchHistory && (
        <ScrollView
          style={{
            marginTop: 16,
            marginLeft: 16,
          }}
        >
          <FlatList<SearchHistoryItem>
            data={searchHistory}
            renderItem={({ item }) => {
              return (
                <TouchableOpacity
                  style={{ flex: 1, flexDirection: 'row', marginBottom: 14 }}
                  onPress={() => {
                    handleQuery(item.query);
                  }}
                >
                  <History
                    size={24}
                    style={{
                      alignSelf: 'center',
                      marginRight: 8,
                    }}
                  />
                  <Text
                    color="$color"
                    style={{
                      fontSize: 16,
                      marginBottom: 8,
                    }}
                  >
                    {item.query}
                  </Text>
                </TouchableOpacity>
              );
            }}
            keyExtractor={item => item.date.toString()}
          />
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

export default SearchScreen;
