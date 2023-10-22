import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Platform } from 'react-native';
import LoginScreen from '../screens/authentication/Login';

export type AuthenticationStackParamList = {
  LoginScreen: undefined;
};

const { Navigator, Screen } =
  createNativeStackNavigator<AuthenticationStackParamList>();

const AuthenticationStack = () => {
  return (
    <Navigator
      initialRouteName="LoginScreen"
      screenOptions={{
        headerShown: false,
        animation: Platform.OS === 'android' ? 'fade_from_bottom' : 'default',
      }}
    >
      <Screen name="LoginScreen" component={LoginScreen} />
    </Navigator>
  );
};
export default AuthenticationStack;
