import { Entypo } from '@expo/vector-icons';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text, View } from 'react-native';
import SettingsScreen from '../../screens/settings/SettingsScreen';
import HomeTabNavigator from './HomeTabNavigator';

type HomeStackParamList = {
  Home: undefined;
  Settings: undefined;
};

type HomeStackNavigation = NavigationProp<HomeStackParamList>;

const HomeStack = createNativeStackNavigator();

const HomeStackNavigator = () => {
  const navigation = useNavigation<HomeStackNavigation>();

  return (
    <HomeStack.Navigator>
      <HomeStack.Screen
        name="Home"
        component={HomeTabNavigator}
        options={{
          // eslint-disable-next-line react/no-unstable-nested-components
          headerRight: () => (
            <View>
              <Text>
                <Entypo
                  name="cog"
                  size={24}
                  color="black"
                  onPress={() => {
                    navigation.navigate('Settings');
                  }}
                />
              </Text>
            </View>
          ),
        }}
      />
      <HomeStack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          headerShown: false,
          presentation: 'modal',
        }}
      />
    </HomeStack.Navigator>
  );
};
export default HomeStackNavigator;
