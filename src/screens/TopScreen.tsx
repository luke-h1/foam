/* eslint-disable @typescript-eslint/ban-ts-comment */
import { useEffect, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import CategoryList from '../components/CategoryList';
import StreamListItem from '../components/StreamListItem';
import Title from '../components/Title';
import { useAuthContext } from '../context/AuthContext';
import twitchService, { Category, Stream } from '../services/twitchService';
import colors from '../styles/colors';
import getTokens from '../utils/getTokens';
import { statusBarHeight } from './FollowingScreen';

const TopScreen = () => {
  const [streams, setStreams] = useState<Stream[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showStreams, setShowStreams] = useState(true);
  const [showCategories, setShowCategories] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { auth } = useAuthContext();

  const fetchTopStreams = async () => {
    const res = await twitchService.getTopStreams(undefined);
    setStreams(res);
  };

  const fetchTopCategories = async () => {
    const { anonToken, token } = await getTokens();

    const res = await twitchService.getTopCategories(
      auth?.isAuth ? (token as string) : (anonToken as string),
    );
    setCategories(res);
  };

  useEffect(() => {
    fetchTopStreams();
    fetchTopCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTopStreams();
    fetchTopCategories();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.wrapper}>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.gray}
            colors={[colors.gray]}
          />
        }
      >
        <>
          <View style={styles.nav}>
            <TouchableOpacity
              onPress={() => {
                setShowStreams(true);
                setShowCategories(false);
              }}
            >
              <Title underline={showStreams}>Streams</Title>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                setShowCategories(true);
                setShowStreams(false);
              }}
            >
              <Title underline={showCategories}>Categories</Title>
            </TouchableOpacity>
          </View>
          {showStreams && (
            <View>
              <FlatList<Stream>
                data={streams}
                renderItem={({ item }) => <StreamListItem stream={item} />}
                keyExtractor={item => item.id}
              />
            </View>
          )}
          {showCategories && (
            <View style={styles.grid}>
              <CategoryList categories={categories} />
            </View>
          )}
        </>
      </ScrollView>
    </SafeAreaView>
  );
};
export default TopScreen;

const styles = StyleSheet.create({
  nav: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-evenly',
  },
  wrapper: {
    backgroundColor: colors.primary,
    flex: 1,
    paddingTop: statusBarHeight,
  },
  grid: {
    margin: 16,
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
    flexDirection: 'row',
  },
});
