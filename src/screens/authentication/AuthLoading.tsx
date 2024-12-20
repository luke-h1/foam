import { useAuthContext } from '@app/context/AuthContext';
import useAppNavigation from '@app/hooks/useAppNavigation';
import { useEffect } from 'react';
import { Text, View } from 'react-native';

export default function AuthLoadingScreen() {
  const { navigate } = useAppNavigation();

  const { getAnonToken } = useAuthContext();

  useEffect(() => {
    getAnonToken().then(() => {
      navigate('Tabs', {
        screen: 'TopStack',
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
