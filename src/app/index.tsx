import { usePopulateAuth } from '@app/hooks';

/**
 * initial route that performs a redirect to the actual main route
 * @see https://github.com/expo/router/issues/428#issuecomment-1540011427
 */
export default function Layout() {
  usePopulateAuth();

  return null;
}
