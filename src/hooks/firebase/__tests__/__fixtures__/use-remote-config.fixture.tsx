import type { ReactNode } from 'react';

import type { FirebaseRemoteConfigTypes } from '@react-native-firebase/remote-config';
import { getAll } from '@react-native-firebase/remote-config';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import type { RemoteConfigKey } from '@app/hooks/firebase/use-remote-config';

/**
 * Makes the root Firebase remote config mock return these raw values, the
 * way the Firebase SDK hands them to `useRemoteConfig`.
 */
export function serveRemoteConfig(
  values: Partial<Record<RemoteConfigKey, string>>,
) {
  const configValues: FirebaseRemoteConfigTypes.ConfigValues = {};

  Object.entries(values).forEach(([key, raw]) => {
    configValues[key] = {
      getSource: () => 'remote',
      asBoolean: () => raw === 'true',
      asNumber: () => Number(raw),
      asString: () => raw,
    };
  });

  jest.mocked(getAll).mockReturnValue(configValues);
}

export function resetRemoteConfig() {
  jest.mocked(getAll).mockReturnValue({});
}

export function createQueryWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return function QueryWrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}
