import type { ReactNode } from 'react';

import type { Value } from '@react-native-firebase/remote-config';
import { getAll } from '@react-native-firebase/remote-config';
import { QueryClientProvider } from '@tanstack/react-query';

import type { RemoteConfigKey } from '@app/hooks/firebase/use-remote-config';
import { createTestQueryClient } from '@app/test/render';

export function serveRemoteConfig(
  values: Partial<Record<RemoteConfigKey, string>>,
) {
  const configValues: Record<string, Value> = {};

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
  const queryClient = createTestQueryClient();

  return function QueryWrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}
