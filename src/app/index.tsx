import { useAuthContext } from '@app/context';
import { usePopulateAuth } from '@app/hooks';
import { useRouter } from 'expo-router';

/**
 * Dummy initial route that redirects to the actual main route
 * @see https://github.com/expo/router/issues/428#issuecomment-1540011427
 */
export default function Layout() {
  usePopulateAuth();

  return null;
}
