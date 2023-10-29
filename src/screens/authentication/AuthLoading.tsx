import { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { RootRoutes, RootStackScreenProps } from '../../navigation/RootStack';

const AuthLoadingScreen = ({
  navigation,
}: RootStackScreenProps<RootRoutes.AuthLoading>) => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setLoading(false);
      navigation.replace(RootRoutes.Home);
    }, 2000);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Loading screen</Text>
      {loading && <ActivityIndicator size="large" />}
    </View>
  );
};
export default AuthLoadingScreen;
