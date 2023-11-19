/* eslint-disable @typescript-eslint/ban-ts-comment */
import { Feather, Entypo } from '@expo/vector-icons';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps } from '@react-navigation/native';
import { useState } from 'react';
import {
  FlatList,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import DismissableKeyboard from '../components/DismissableKeyboard';
import Header from '../components/Header';
import Title from '../components/Title';
import useDebouncedCallback from '../hooks/useDebouncedCallback';
import {
  HomeTabsParamList,
  HomeTabsRoutes,
  HomeTabsScreenProps,
} from '../navigation/Home/HomeTabs';
import twitchService, {
  SearchChannelResponse,
} from '../services/twitchService';
import colors from '../styles/colors';
import elapsedStreamTime from '../utils/elapsedStreamTime';
import { statusBarHeight } from './FollowingScreen';

const SearchScreen = ({
  navigation,
}: CompositeScreenProps<
  HomeTabsScreenProps<HomeTabsRoutes.Search>,
  BottomTabScreenProps<HomeTabsParamList>
>) => {
  const [searchResults, setSearchResults] = useState<SearchChannelResponse[]>(
    [],
  );

  const previousSearches = [
    'psp1g',
    'poke',
    'xqc',
    'brittt',
    'deme',
    'nadia',
  ] as const;

  const [search] = useDebouncedCallback(async (value: string) => {
    if (value.length < 2) {
      setSearchResults([]);
      // eslint-disable-next-line no-useless-return
      return;
    }

    const results = await twitchService.searchChannels(value);

    setSearchResults(results);

    console.log('---------------------------------');
    console.log('results.data is:', results);
    console.log('---------------------------------');
  }, 400);

  return (
    <SafeAreaView style={styles.wrapper}>
      <View style={styles.container}>
        {/* @ts-ignore */}
        <Header title="Search" navigation={navigation} />
      </View>
      <View style={{ flexDirection: 'row' }}>
        <Feather
          name="search"
          size={24}
          color={colors.gray}
          style={{ marginLeft: 16, alignSelf: 'center' }}
        />
        <DismissableKeyboard>
          <ScrollView contentContainerStyle={styles.scrollContainer}>
            <SafeAreaView>
              <TextInput
                style={styles.input}
                placeholder="Find a channel"
                placeholderTextColor={colors.gray}
                onChangeText={text => search(text.toLowerCase())}
              />
            </SafeAreaView>
          </ScrollView>
        </DismissableKeyboard>
      </View>
      <View>
        <Title>Channels</Title>
        <FlatList
          data={searchResults}
          renderItem={({ item }) => (
            <View
              style={{
                flexDirection: 'row',
                marginBottom: 14,
                marginLeft: 14,
                alignContent: 'center',
                alignItems: 'center',
              }}
            >
              <Image
                source={{ uri: item.thumbnail_url, width: 40, height: 40 }}
                style={{ borderRadius: 20, marginRight: 5 }}
              />
              <Text style={{ marginLeft: 8, color: colors.gray }}>
                {item.display_name}
              </Text>
              {/* drop onto next line */}
              {item.is_live && (
                <View
                  style={{
                    // drop any children onto next line
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
            </View>
          )}
        />
      </View>
      {!searchResults.length && (
        <View style={styles.previousSearches}>
          <FlatList<string>
            data={previousSearches}
            renderItem={({ item }) => (
              <View style={{ flex: 1, flexDirection: 'row', marginBottom: 14 }}>
                <Entypo
                  name="back-in-time"
                  size={24}
                  color={colors.gray}
                  style={{ alignSelf: 'center', marginRight: 8 }}
                />
                <Text style={styles.previousSearch}>{item}</Text>
              </View>
            )}
            keyExtractor={item => item}
          />
        </View>
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
