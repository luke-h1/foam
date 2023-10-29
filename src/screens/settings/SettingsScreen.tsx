import { Button, Text, View } from 'react-native';
import { RootRoutes, RootStackScreenProps } from '../../navigation/RootStack';

const SettingsModal = ({
  navigation,
}: RootStackScreenProps<RootRoutes.SettingsModal>) => {
  return (
    <View>
      <Text>settings</Text>
      <Button
        onPress={() => navigation.navigate(RootRoutes.Login)}
        title="sign in"
      />
    </View>
  );
};

export default SettingsModal;
