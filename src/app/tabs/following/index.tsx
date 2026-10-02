import { router } from 'expo-router';

import { DeferUntilFocused } from '@app/components/defer-until-focused/defer-until-focused';
import { LoadingState } from '@app/components/loading-state/loading-state';
import { EmptyState } from '@app/components/ui/empty-state/empty-state';
import { useAuthContext } from '@app/context/auth-context';
import FollowingScreen from '@app/screens/following-screen/following-screen';

export default function FollowingRoute() {
  const { authState, ready } = useAuthContext();

  if (!ready) {
    return <LoadingState />;
  }

  if (!authState) {
    return (
      <EmptyState
        iconName='exclamationmark.triangle'
        heading="Couldn't check your account"
        content='You can still browse top streams while Foam retries.'
        button='Browse top streams'
        buttonOnPress={() => router.replace('/tabs/top')}
      />
    );
  }

  return (
    <DeferUntilFocused>
      <FollowingScreen />
    </DeferUntilFocused>
  );
}
