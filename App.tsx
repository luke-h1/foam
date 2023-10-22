import { NavigationContainer } from '@react-navigation/native';
import HomeStackNavigator from './src/navigation/Home/HomeStack';

export default function App() {
  return (
    <NavigationContainer>
      <HomeStackNavigator />
    </NavigationContainer>
  );
}
