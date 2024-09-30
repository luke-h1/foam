import { useEffect } from 'react';
import { Text, View } from 'react-native';
import { RootRoutes, RootStackScreenProps } from '../../navigation/RootStack';

const AuthLoadingScreen = ({
  navigation,
}: RootStackScreenProps<RootRoutes.AuthLoading>) => {
  const { navigate } = navigation;

  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    setTimeout(() => {
      navigate(RootRoutes.Home);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <View>
        <Text>Loading...</Text>
      </View>
    </View>
  );
};
export default AuthLoadingScreen;
