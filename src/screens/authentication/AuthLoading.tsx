import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { RootRoutes, RootStackScreenProps } from '../../navigation/RootStack';
import colors from '../../styles/colors';

const AuthLoadingScreen = ({
  navigation,
}: RootStackScreenProps<RootRoutes.AuthLoading>) => {
  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    setTimeout(() => {
      navigation.navigate(RootRoutes.Home);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Loading...</Text>
      <ActivityIndicator size="large" />
    </View>
  );
};
export default AuthLoadingScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.primary,
  },
  text: {
    color: colors.gray,
  },
});
