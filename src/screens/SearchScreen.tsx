/* eslint-disable no-console */
import { Feather, Entypo } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import {
  FlatList,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import DismissableKeyboard from '../components/DismissableKeyboard';
import Image from '../components/Image';
import Title from '../components/Title';
import useDebouncedCallback from '../hooks/useDebouncedCallback';
import { HomeTabsParamList } from '../navigation/Home/HomeTabs';
import { StreamRoutes } from '../navigation/Stream/StreamStack';
import twitchService, {
  SearchChannelResponse,
} from '../services/twitchService';
import colors from '../styles/colors';
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
    <SafeAreaView style={styles.wrapper}>
      <View style={{ flexDirection: 'row', padding: 5 }}>
        <DismissableKeyboard>
          <ScrollView contentContainerStyle={styles.scrollContainer}>
            <SafeAreaView style={{ flexDirection: 'row' }}>
              <TextInput
                style={styles.input}
                placeholder="Find a channel"
                placeholderTextColor={colors.gray}
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
            style={[{ alignSelf: 'center', marginRight: 15 }, styles.icon]}
            color={colors.gray}
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
            color={colors.gray}
            style={{ alignSelf: 'center', marginRight: 15 }}
            onPress={() => search(query)}
          />
        )}
      </View>
      <View>
        {searchResults.length > 0 && <Title>Channels</Title>}
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
              <Text style={{ marginLeft: 8, color: colors.gray }}>
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
                    style={{
                      backgroundColor: colors.red,
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      marginRight: 5,
                    }}
                  />
                  <Text style={{ color: colors.gray }}>
                    {elapsedStreamTime(item.started_at)}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          )}
        />
      </View>

      {searchHistory && (
        <ScrollView style={styles.previousSearches}>
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
                    color={colors.gray}
                    style={{ alignSelf: 'center', marginRight: 8 }}
                  />
                  <Text style={styles.previousSearch}>{item.query}</Text>
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

const styles = StyleSheet.create({
  icon: {
    alignSelf: 'center',
    marginRight: 8,
  },
  input: {
    borderRadius: 4,
    borderColor: colors.gray,
    width: '90%',
    alignSelf: 'center',
    color: colors.gray,
    height: 40,
    margin: 12,
    borderWidth: 1,
    padding: 10,
  },
  wrapper: {
    backgroundColor: colors.primary,
    flex: 1,
    paddingTop: statusBarHeight,
  },
  container: {
    paddingLeft: 14,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  previousSearches: {
    marginTop: 16,
    marginLeft: 16,
  },
  previousSearch: {
    color: colors.gray,
    fontSize: 16,
    marginBottom: 8,
  },
});

export default SearchScreen;
