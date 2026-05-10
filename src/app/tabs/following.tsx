import { useAuthContext } from '@app/context/AuthContext';
import FollowingScreen from '@app/screens/FollowingScreen';
import { Redirect } from 'expo-router';

export default function FollowingRoute() {
  const { authState, ready } = useAuthContext();

  if (!ready || !authState) {
    return null;
  }

  if (!authState.isLoggedIn) {
    return <Redirect href="/tabs/top" />;
  }

  return <FollowingScreen />;
}
