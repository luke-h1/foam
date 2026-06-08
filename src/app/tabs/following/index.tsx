import { DeferUntilFocused } from '@app/components/DeferUntilFocused/DeferUntilFocused';
import { useAuthContext } from '@app/context/AuthContext';
import FollowingScreen from '@app/screens/FollowingScreen';
import { router } from 'expo-router';
import { Button } from '@app/components/Button/Button';
import { StyleSheet, View } from 'react-native';
import { Text } from '@app/components/ui/Text/Text';
import { theme } from '@app/styles/themes';
import { LiveStreamCardSkeleton } from '@app/components/LiveStreamCard/LiveStreamCardSkeleton';

const SKELETON_ROW_IDS = [
  'skeleton-row-0',
  'skeleton-row-1',
  'skeleton-row-2',
  'skeleton-row-3',
  'skeleton-row-4',
  'skeleton-row-5',
] as const;

export default function FollowingRoute() {
  const { authState, ready } = useAuthContext();

  if (!ready) {
    return (
      <View style={styles.skeletonContainer}>
        {SKELETON_ROW_IDS.map(id => (
          <LiveStreamCardSkeleton key={id} />
        ))}
      </View>
    );
  }

  if (!authState) {
    return (
      <View style={styles.container}>
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
  skeletonContainer: {
    backgroundColor: theme.color.background.dark,
    flex: 1,
    paddingTop: theme.space12,
  },
  continueButton: {
    marginTop: theme.space16,
    width: '100%',
  },
});
