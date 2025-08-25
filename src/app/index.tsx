import { useAuthContext } from '@app/context';
import { Href, Redirect } from 'expo-router';

/**
 * redirect to main route `/(tabs)/top`
 * @see https://github.com/expo/router/issues/428#issuecomment-1540011427
 */
export default function Layout() {
  const { authState } = useAuthContext();

  const redirectRoute: Href = authState?.isAnonAuth
    ? '/(tabs)/top-streams'
    : `/(tabs)/following`;

  return <Redirect href={redirectRoute} />;
}
