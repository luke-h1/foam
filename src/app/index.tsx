import { Redirect } from 'expo-router';

/**
 * Dummy initial route that redirects to the actual main route `/(tabs)/home`
 * @see https://github.com/expo/router/issues/428#issuecomment-1540011427
 */
export default function Layout() {
  return <Redirect href="/(tabs)/top/top-streams" />;
}
