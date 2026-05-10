import { useAuthContext } from '@app/context/AuthContext';
import { Redirect } from 'expo-router';

export default function IndexRoute() {
  const { authState, ready } = useAuthContext();

  if (!ready || !authState) {
    return null;
  }

  return (
    <Redirect href={authState.isLoggedIn ? '/tabs/following' : '/tabs/top'} />
  );
}
