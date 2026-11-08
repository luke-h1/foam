import { useRootNavigationState } from 'expo-router';

/**
 * The root navigation state gets a key once the navigation container has
 * mounted. Before that, an imperative `router` call is dropped.
 */
export function useIsRouterReady(): boolean {
  return Boolean(useRootNavigationState()?.key);
}
