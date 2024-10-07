import { RootRoutes, RootStackScreenProps } from '@app/navigation/RootStack';
import theme from '@app/styles/theme';
import {
  Button,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';

const WelcomeScreen = ({
  navigation,
}: RootStackScreenProps<RootRoutes.Home>) => {
  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Foam</Text>
      <Text style={styles.tagLine}>Watch your favorite streamers!</Text>
      <Button
        title="Let me in!"
        onPress={() => {
          navigation.navigate(RootRoutes.Home);
        }}
      />
    </View>
  );
};
export default WelcomeScreen;

const styles = StyleSheet.create<{
  container: ViewStyle;
  heading: TextStyle;
  tagLine: TextStyle;
}>({
  container: {
    flex: 1,
    justifyContent: 'space-evenly',
    alignItems: 'center',
    backgroundColor: theme.color.white,
    paddingHorizontal: 0,
  },
  heading: {
    fontSize: 42,
    color: theme.color.white,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  tagLine: {
    fontSize: 34,
    color: theme.color.white,
    textAlign: 'center',
  },
});
