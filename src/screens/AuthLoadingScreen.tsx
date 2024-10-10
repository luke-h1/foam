import { RootStackScreenProps, RootRoutes } from '@app/navigation/RootStack';
import { useEffect } from 'react';
import { Text, View } from 'react-native';

export default function AuthLoadingScreen({
  navigation,
}: RootStackScreenProps<RootRoutes.AuthLoading>) {
  const { navigate } = navigation;

  // TODO: actually acquire auth tokens here
  // TODO: move this to different stack

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
}
