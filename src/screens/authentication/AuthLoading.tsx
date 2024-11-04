import { useAuthContext } from '@app/context/AuthContext';
import { HomeTabsRoutes } from '@app/navigation/Home/HomeTabs';
import { useEffect } from 'react';
import { Text, View } from 'react-native';
import { RootRoutes, RootStackScreenProps } from '../../navigation/RootStack';

export default function AuthLoadingScreen({
  navigation,
}: RootStackScreenProps<RootRoutes.AuthLoading>) {
  const { navigate } = navigation;

  const { getAnonToken } = useAuthContext();

  useEffect(() => {
    getAnonToken().then(() => {
      navigate(RootRoutes.Home, {
        screen: HomeTabsRoutes.Top,
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <Text>Loading...</Text>
    </View>
  );
}
