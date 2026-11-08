import { useNetworkActivityDevTools } from '@rozenite/network-activity-plugin';
import { useRequireProfilerDevTools } from '@rozenite/require-profiler-plugin';
import {
  createMMKVStorageAdapter,
  useRozeniteStoragePlugin,
} from '@rozenite/storage-plugin';
import { useTanStackQueryDevTools } from '@rozenite/tanstack-query-plugin';
import { useQueryClient } from '@tanstack/react-query';
import * as Clipboard from 'expo-clipboard';

import { useDebugOptions } from '@app/hooks/use-debug-options';
import { storage } from '@app/lib/storage';
import { logger } from '@app/utils/logger';

// SAFETY: the require resolves the same module the type import names.
const DevToolsBubble = (
  require('react-native-react-query-devtools') as typeof import('react-native-react-query-devtools')
).DevToolsBubble;

export function QueryDevelopmentTools() {
  const queryClient = useQueryClient();
  const { ReactQueryDebug } = useDebugOptions();

  useTanStackQueryDevTools(queryClient);

  if (!ReactQueryDebug?.enabled) {
    return null;
  }

  return (
    <DevToolsBubble
      queryClient={queryClient}
      onCopy={async text => {
        try {
          await Clipboard.setStringAsync(text);
          return true;
        } catch (error) {
          logger.main.warn('[DevTools] failed to copy to clipboard', {
            error,
          });
          return false;
        }
      }}
    />
  );
}

export function DevTools() {
  useNetworkActivityDevTools();
  useRequireProfilerDevTools();

  useRozeniteStoragePlugin({
    storages: [
      createMMKVStorageAdapter({
        storages: {
          storageService: storage,
        },
      }),
    ],
  });

  return null;
}
