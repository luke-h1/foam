import React, { useEffect, useState } from 'react';
import { Text } from 'react-native';
import Box from '../../components/Box';
import Loader from '../../components/Loader';
import SafeAreaContainer from '../../components/SafeAreaContainer';
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
    <SafeAreaContainer>
      <Box flex={1} alignItems="center" justifyContent="center">
        <Text>Loading screen</Text>
        {loading && <Loader />}
      </Box>
    </SafeAreaContainer>
  );
};
export default AuthLoadingScreen;
