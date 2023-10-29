import * as Clipboard from 'expo-clipboard';
import { Button, Text, View } from 'react-native';
import { useAuthContext } from '../context/AuthContext';

const FollowingScreen = () => {
  const { token } = useAuthContext();
  return (
    <View>
      <Text>Following Screen</Text>
      <Text selectable>
        Auth Details:
        {JSON.stringify(token, null, 2)}
      </Text>
      <Button
        title="copy access token"
        onPress={() => Clipboard.setStringAsync(token?.accessToken as string)}
      />
    </View>
  );
};
export default FollowingScreen;
