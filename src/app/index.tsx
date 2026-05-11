import { useAuthContext } from '@app/context/AuthContext';
import { Button } from '@app/components/Button/Button';
import { Text } from '@app/components/ui/Text/Text';
import { theme } from '@app/styles/themes';
import { Redirect, useRouter } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

export default function IndexRoute() {
  const { authState, ready } = useAuthContext();
  const router = useRouter();

  if (!ready) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={theme.colorGreen} />
        <Text
          type="sm"
          color="gray.textLow"
          align="center"
          style={styles.message}
        >
          Starting Foam...
        </Text>
      </View>
    );
  }

  if (!authState) {
    return (
      <View style={styles.container}>
        <Text type="lg" align="center" style={styles.message}>
          Authentication state is not ready.
        </Text>
        <Button
          onPress={() => {
            router.replace('/tabs/top');
          }}
        >
          <Text type="md" color="accent" contrast align="center">
            Continue
          </Text>
        </Button>
      </View>
    );
  }

  return (
    <Redirect href={authState.isLoggedIn ? '/tabs/following' : '/tabs/top'} />
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: theme.color.background.dark,
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: theme.space28,
  },
  message: {
    marginBottom: theme.space16,
  },
});
