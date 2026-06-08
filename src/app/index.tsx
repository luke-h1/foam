import { useAuthContext } from '@app/context/AuthContext';
import { Button } from '@app/components/Button/Button';
import { Text } from '@app/components/ui/Text/Text';
import { theme } from '@app/styles/themes';
import { Redirect, router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { LiveStreamCardSkeleton } from '@app/components/LiveStreamCard/LiveStreamCardSkeleton';

const SKELETON_ROW_IDS = [
  'skeleton-row-0',
  'skeleton-row-1',
  'skeleton-row-2',
  'skeleton-row-3',
  'skeleton-row-4',
  'skeleton-row-5',
] as const;

export default function IndexRoute() {
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
    paddingTop: theme.space12,
  },
});
