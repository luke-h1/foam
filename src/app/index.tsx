import { StyleSheet, View } from 'react-native';

import { Redirect, router } from 'expo-router';

import { Button } from '@app/components/button/button';
import { Text } from '@app/components/ui/text/text';
import { useAuthContext } from '@app/context/auth-context';
import { useStartupMark } from '@app/hooks/use-startup-mark';
import { storage } from '@app/lib/storage';
import { ONBOARDING_SEEN_KEY } from '@app/screens/onboarding-screen/constants';
import { isE2EMode } from '@app/services/api/clients';
import { theme } from '@app/styles/themes';

export default function IndexRoute() {
  useStartupMark('index_route_render');
  const { authState, ready } = useAuthContext();
  const hasSeenOnboarding = storage.getBoolean(ONBOARDING_SEEN_KEY);

  if (!hasSeenOnboarding && !isE2EMode) {
    return <Redirect href='/onboarding' />;
  }

  if (!ready) {
    return <View style={styles.splash} />;
  }

  if (!authState) {
    return (
      <View style={styles.container}>
        <Text type='lg' align='center' style={styles.message}>
          Authentication state is not ready.
        </Text>
        <Button
          onPress={() => {
            router.replace('/tabs/top');
          }}
        >
          <Text type='md' color='accent' contrast align='center'>
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
    marginTop: theme.space16,
  },
  splash: {
    backgroundColor: theme.color.background.dark,
    flex: 1,
  },
});
