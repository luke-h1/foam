import { useAuthContext } from '@app/context/AuthContext';
import FollowingScreen from '@app/screens/FollowingScreen';
import { Redirect, useRouter } from 'expo-router';
import { Button } from '@app/components/Button/Button';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Text } from '@app/components/ui/Text/Text';
import { theme } from '@app/styles/themes';

export default function FollowingRoute() {
  const { authState, ready } = useAuthContext();
  const router = useRouter();

  if (!ready || !authState) {
    return (
      <View style={styles.container}>
        {ready ? (
          <>
            <Text type="sm" color="gray.textLow" align="center">
              Authentication state is not ready.
            </Text>
            <Button
              style={styles.continueButton}
              onPress={() => {
                router.replace('/tabs/top');
              }}
            >
              <Text type="sm" color="accent" contrast align="center">
                Continue
              </Text>
            </Button>
          </>
        ) : (
          <>
            <ActivityIndicator size="large" color={theme.colorGreen} />
            <Text
              type="sm"
              color="gray.textLow"
              align="center"
              style={styles.message}
            >
              Starting Foam...
            </Text>
          </>
        )}
      </View>
    );
  }

  if (!authState.isLoggedIn) {
    return <Redirect href="/tabs/top" />;
  }

  return <FollowingScreen />;
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
    marginTop: theme.space8,
  },
  continueButton: {
    marginTop: theme.space16,
    width: '100%',
  },
});
