import { useAuthContext } from '@app/context/AuthContext';
import { Button } from '@app/components/Button/Button';
import { LiveStreamCardSkeleton } from '@app/components/LiveStreamCard/LiveStreamCardSkeleton';
import { Text } from '@app/components/ui/Text/Text';
import { storageMMKV } from '@app/lib/mmkv';
import { ONBOARDING_SEEN_KEY } from '@app/screens/OnboardingScreen/OnboardingScreen';
import { isE2EMode } from '@app/services/api/clients';
import { theme } from '@app/styles/themes';
import { Redirect, router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

export default function IndexRoute() {
  const { authState, ready } = useAuthContext();
  const hasSeenOnboarding = storageMMKV.getBoolean(ONBOARDING_SEEN_KEY);

  // E2E builds wipe app data on every launch, so onboarding would otherwise
  // gate every test behind its intro screen.
  if (!hasSeenOnboarding && !isE2EMode) {
    return <Redirect href='/onboarding' />;
  }

  if (!ready) {
    return (
      <View style={styles.skeletonContainer}>
        {Array.from({ length: 6 }).map((_, index) => (
          // eslint-disable-next-line react/no-array-index-key
          <LiveStreamCardSkeleton key={index} />
        ))}
      </View>
    );
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
  skeletonContainer: {
    backgroundColor: theme.color.background.dark,
    flex: 1,
    paddingTop: theme.space84,
  },
});
