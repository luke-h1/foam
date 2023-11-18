/* eslint-disable @typescript-eslint/ban-ts-comment */
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps } from '@react-navigation/native';
import { SafeAreaView, StyleSheet, View } from 'react-native';
import CategoryList from '../components/CategoryList';
import Header from '../components/Header';
import {
  HomeTabsParamList,
  HomeTabsRoutes,
  HomeTabsScreenProps,
} from '../navigation/Home/HomeTabs';
import colors from '../styles/colors';
import { statusBarHeight } from './FollowingScreen';

const TopScreen = ({
  navigation,
}: CompositeScreenProps<
  HomeTabsScreenProps<HomeTabsRoutes.Top>,
  BottomTabScreenProps<HomeTabsParamList>
>) => {
  return (
    <SafeAreaView style={styles.wrapper}>
      <View style={styles.container}>
        {/* @ts-ignore */}
        <Header title="Top" navigation={navigation} />
        <View style={styles.grid}>
          <CategoryList />
        </View>
      </View>
    </SafeAreaView>
  );
};
export default TopScreen;

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: colors.primary,
    flex: 1,
    paddingTop: statusBarHeight,
  },
  container: {
    paddingLeft: 14,
  },
  grid: {
    margin: 16,
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
    flexDirection: 'row',
  },
});
