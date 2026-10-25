import { router } from 'expo-router';

import { DeferUntilFocused } from '@app/components/defer-until-focused/DeferUntilFocused';
import { LoadingState } from '@app/components/loading-state/LoadingState';
import { StreamListLayoutMenu } from '@app/components/stream-list-layout-toggle/StreamListLayoutMenu';
import { EmptyState } from '@app/components/ui/empty-state/EmptyState';
import { useAuthContext } from '@app/context/AuthContext';
import FollowingScreen from '@app/screens/following/FollowingScreen';

function FollowingRouteContent() {
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

export default function FollowingRoute() {
  return (
    <>
      <StreamListLayoutMenu />
      <FollowingRouteContent />
    </>
  );
}
