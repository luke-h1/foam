/* eslint-disable react/no-unstable-nested-components */
import { AntDesign, Feather } from '@expo/vector-icons';
// import BrowseScreen from '../../screens/BrowseScreen';
import FollowingScreen from '../../screens/FollowingScreen';
import SearchScreen from '../../screens/SearchScreen';
import TopScreen from '../../screens/TopScreen';
import colors from '../../styles/colors';
import { RootRoutes, RootStackScreenProps } from '../RootStack';
import { HomeTabs, HomeTabsRoutes } from './HomeTabs';

const HomeTabsNavigator = ({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  navigation,
}: RootStackScreenProps<RootRoutes.Home>) => {
  return (
    <HomeTabs.Navigator
      initialRouteName={HomeTabsRoutes.Following}
      screenOptions={{
        headerTitleAlign: 'left',
        headerShown: false,
        tabBarActiveTintColor: colors.purple,
        tabBarStyle: {
          backgroundColor: colors.primary,
        },
        // eslint-disable-next-line react/no-unstable-nested-components
        // headerRight: () => (
        //   <View>
        //     <Header title={navigation.} />
        //     {/* <Text>
        //       <Entypo
        //         name="cog"
        //         size={24}
        //         color="black"
        //         onPress={() => {
        //           navigation.navigate(RootRoutes.SettingsModal);
        //         }}
        //       />
        //     </Text> */}
        //   </View>
        // ),
      }}
    >
      <HomeTabs.Screen
        name={HomeTabsRoutes.Following}
        component={FollowingScreen}
        options={{
          tabBarIcon: () => (
            <Feather name="heart" size={24} color={colors.gray} />
          ),
        }}
      />
      <HomeTabs.Screen
        name={HomeTabsRoutes.Top}
        component={TopScreen}
        options={{
          tabBarIcon: () => (
            <AntDesign name="totop" size={24} color={colors.gray} />
          ),
        }}
      />
      {/* <HomeTabs.Screen name={HomeTabsRoutes.Browse} component={BrowseScreen} /> */}
      <HomeTabs.Screen
        name={HomeTabsRoutes.Search}
        component={SearchScreen}
        options={{
          tabBarIcon: () => (
            <Feather name="search" size={24} color={colors.gray} />
          ),
        }}
      />
    </HomeTabs.Navigator>
  );
};

export default HomeTabsNavigator;
