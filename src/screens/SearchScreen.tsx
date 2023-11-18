/* eslint-disable @typescript-eslint/ban-ts-comment */
import { Feather, Entypo } from '@expo/vector-icons';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { useHeaderHeight } from '@react-navigation/elements';
import { CompositeScreenProps } from '@react-navigation/native';
import {
  FlatList,
  KeyboardAvoidingView,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import DismissableKeyboard from '../components/DismissableKeyboard';
import Header from '../components/Header';
import {
  HomeTabsParamList,
  HomeTabsRoutes,
  HomeTabsScreenProps,
} from '../navigation/Home/HomeTabs';
import colors from '../styles/colors';
import { statusBarHeight } from './FollowingScreen';

const SearchScreen = ({
  navigation,
}: CompositeScreenProps<
  HomeTabsScreenProps<HomeTabsRoutes.Search>,
  BottomTabScreenProps<HomeTabsParamList>
>) => {
  const previousSearches = [
    'psp1g',
    'poke',
    'xqc',
    'brittt',
    'deme',
    'nadia',
  ] as const;

  const height = useHeaderHeight();

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
          <KeyboardAvoidingView
            behavior="padding"
            style={{ flex: 1 }}
            keyboardVerticalOffset={height}
          >
            <ScrollView contentContainerStyle={styles.scrollContainer}>
              <TextInput
                style={styles.input}
                placeholder="Find a channel"
                placeholderTextColor={colors.gray}
              />
            </ScrollView>
          </KeyboardAvoidingView>
        </DismissableKeyboard>
      </View>
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
    borderWidth: 1,
    borderColor: colors.gray,
    padding: 4,
    width: '90%',
    alignSelf: 'center',
    color: colors.gray,
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
