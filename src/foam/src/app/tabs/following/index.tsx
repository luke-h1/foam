import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { router } from 'expo-router';

import { Button } from '@app/components/Button/Button';
import { DeferUntilFocused } from '@app/components/DeferUntilFocused/DeferUntilFocused';
import { Text } from '@app/components/ui/Text/Text';
import { useAuthContext } from '@app/context/AuthContext';
import FollowingScreen from '@app/screens/FollowingScreen';
import { theme } from '@app/styles/themes';

export default function FollowingRoute() {
  const { authState, ready } = useAuthContext();

  if (!ready || !authState) {
    return (
      <View style={styles.container}>
        {ready ? (
          <>
            <Text type='sm' color='gray.textLow' align='center'>
              Authentication state is not ready.
            </Text>
            <Button
              style={styles.continueButton}
              onPress={() => {
                router.replace('/tabs/top');
              }}
            >
              <Text type='sm' color='accent' contrast align='center'>
                Continue
              </Text>
            </Button>
          </>
        ) : (
          <>
            <ActivityIndicator size='large' color={theme.colorPrimary} />
            <Text
              type='sm'
              color='gray.textLow'
              align='center'
              style={styles.message}
            >
              Starting Foam...
            </Text>
          </>
        )}
      </View>
    );
  }

  return (
    <DeferUntilFocused>
      <FollowingScreen />
    </DeferUntilFocused>
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
    marginTop: theme.space8,
  },
  continueButton: {
    marginTop: theme.space16,
    width: '100%',
  },
});
