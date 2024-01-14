import { useEffect } from 'react';
import { ActivityIndicator } from 'react-native';
import { Stack } from 'tamagui';
import { Text } from '../../components/Text';
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
    <Stack flex={1} justifyContent="center" alignItems="center">
      <Text>Loading...</Text>
      <ActivityIndicator size="large" />
    </Stack>
  );
};
export default AuthLoadingScreen;
