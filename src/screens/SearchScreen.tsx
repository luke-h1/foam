/* eslint-disable no-console */
import { Feather, Entypo } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import {
  FlatList,
  SafeAreaView,
  ScrollView,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { H5, Stack, Text, View } from 'tamagui';
import DismissableKeyboard from '../components/DismissableKeyboard';
import Image from '../components/Image';
import useDebouncedCallback from '../hooks/useDebouncedCallback';
import { HomeTabsParamList } from '../navigation/Home/HomeTabs';
import { StreamRoutes } from '../navigation/Stream/StreamStack';
import twitchService, {
  SearchChannelResponse,
} from '../services/twitchService';
import elapsedStreamTime from '../utils/elapsedStreamTime';
import { statusBarHeight } from './FollowingScreen';

interface SearchHistoryItem {
  date: Date;
  query: string;
}

const SearchScreen = () => {
  const [query, setQuery] = useState<string>('');
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
                style={{
                  borderRadius: 4,
                  width: '90%',
                  alignSelf: 'center',
                  height: 40,
                  margin: 12,
                  borderWidth: 1,
                  padding: 10,
                }}
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
          <Entypo
            name="cross"
            size={24}
            style={[{ alignSelf: 'center', marginRight: 15 }]}
            onPress={() => {
              setQuery('');
              setSearchResults([]);
              setShowDismiss(false);
            }}
          />
        ) : (
          <Feather
            name="search"
            size={24}
            style={{ alignSelf: 'center', marginRight: 25 }}
            onPress={() => search(query)}
          />
        )}
      </Stack>
      <Stack marginBottom={14} marginLeft={14}>
        {searchResults.length > 0 && (
          <>
            <H5 style={{ marginLeft: 15, marginBottom: 15 }} color="$color">
              Channels
            </H5>
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
                  <Entypo
                    name="back-in-time"
                    size={24}
                    style={{
                      alignSelf: 'center',
                      marginRight: 8,
                      color: '$color',
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
