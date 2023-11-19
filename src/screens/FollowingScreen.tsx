/* eslint-disable @typescript-eslint/ban-ts-comment */
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps } from '@react-navigation/native';
import Constants from 'expo-constants';
import { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  SafeAreaView,
  StyleSheet,
  View,
  Platform,
} from 'react-native';
import Header from '../components/Header';
import StreamList from '../components/StreamList';
import Title from '../components/Title';
import { useAuthContext } from '../context/AuthContext';
import {
  HomeTabsParamList,
  HomeTabsRoutes,
  HomeTabsScreenProps,
} from '../navigation/Home/HomeTabs';
import twitchService, { Stream } from '../services/twitchService';
import colors from '../styles/colors';

export interface Section {
  key: string;
  render: () => JSX.Element;
  isTitle?: boolean;
}

const FollowingScreen = ({
  navigation,
}: CompositeScreenProps<
  HomeTabsScreenProps<HomeTabsRoutes.Following>,
  BottomTabScreenProps<HomeTabsParamList>
>) => {
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
        {/* @ts-ignore */}
        <Header title="Following" navigation={navigation} />
        <View>
          <FlatList<Section>
            data={data}
            renderItem={({ item }) => item.render()}
            keyExtractor={item => item.key}
            stickyHeaderIndices={stickyHeaderIndicies}
            onRefresh={() => {}}
            refreshing={false}
          />
        </View>
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
