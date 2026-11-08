import { useRootNavigationState } from 'expo-router';

export function useIsRouterReady(): boolean {
  return Boolean(useRootNavigationState()?.key);
}
