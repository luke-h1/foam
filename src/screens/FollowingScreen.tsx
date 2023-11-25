/* eslint-disable no-console */

import Constants from 'expo-constants';
import { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  SafeAreaView,
  StyleSheet,
  View,
  Platform,
  ScrollView,
} from 'react-native';
import StreamList from '../components/StreamList';
import Title from '../components/Title';
import { useAuthContext } from '../context/AuthContext';

import twitchService, { Stream } from '../services/twitchService';
import colors from '../styles/colors';

export interface Section {
  key: string;
  render: () => JSX.Element;
  isTitle?: boolean;
}

const FollowingScreen = () => {
  const { user } = useAuthContext();
  const [streams, setStreams] = useState<Stream[]>([]);

  const fetchFollowedStreams = async () => {
    try {
      console.log('user is', user);
      console.log('user id', user?.id);
      const res = await twitchService.getFollowedStreams(user?.id as string);
      console.log(res);
      setStreams(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchFollowedStreams();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { data, stickyHeaderIndicies } = useMemo(() => {
    // eslint-disable-next-line no-shadow
    const data: Section[] = [
      { key: 'C2', render: () => <StreamList key="1" streams={streams} /> },

      // {
      //   key: 'FOLLOWED_CATEGORIES',
      //   render: () => <Title>Followed Categories</Title>,
      //   isTitle: true,
      // },
      // {
      //   key: 'C1',
      //   render: () => <CategoryList />,
      // },
      // { key: 'C2', render: () => <StreamList key="1" /> },
      // {
      //   key: 'CONTINUE_WATCHING',
      //   render: () => <Title>Continue Watching</Title>,
      //   isTitle: true,
      // },
      // {
      //   key: 'C3',
      //   render: () => <View />,
      // },
      {
        key: 'OFFLINE_CHANNELS',
        render: () => <Title>Offline Channels</Title>,
        isTitle: true,
      },
      // {
      //   key: 'C4',
      //   render: () => <View />,
      // },
    ];

    // eslint-disable-next-line no-shadow
    const stickyHeaderIndicies: number[] = [];

    data.forEach((section, index) => {
      if (section.isTitle) {
        stickyHeaderIndicies.push(index);
      }
    });

    return {
      data,
      stickyHeaderIndicies,
    };
  }, [streams]);

  return (
    <SafeAreaView style={styles.wrapper}>
      <View style={styles.container}>
        <ScrollView>
          <FlatList<Section>
            data={data}
            renderItem={({ item }) => item.render()}
            keyExtractor={item => item.key}
            stickyHeaderIndices={stickyHeaderIndicies}
            onRefresh={() => {}}
            refreshing={false}
          />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

export default FollowingScreen;

export const statusBarHeight =
  Platform.OS === 'android' ? Constants.statusBarHeight : 0;

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: colors.primary,
    flex: 1,
    paddingTop: statusBarHeight,
  },
  container: {
    paddingLeft: 14,
  },
});
