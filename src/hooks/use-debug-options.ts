import { useSyncExternalStore } from 'react';

import {
  type AllowedKey,
  type StorageChangeEvent,
  storageService,
} from '@app/lib/storage';

export type DebugOptions = {
  [key in AllowedKey]?: { enabled: boolean };
};

const enabledDebugOptions: DebugOptions = {
  ReactQueryDebug: { enabled: true },
};

const disabledDebugOptions: DebugOptions = {
  ReactQueryDebug: { enabled: false },
};

function getDebugOptionsSnapshot(): DebugOptions {
  return storageService.getString<boolean>('ReactQueryDebug') === true
    ? enabledDebugOptions
    : disabledDebugOptions;
}

function subscribeToDebugOptions(onStoreChange: () => void): () => void {
  const handleStorageChange = (event: StorageChangeEvent) => {
    if (
      event.kind === 'clearAll' ||
      ('key' in event && event.key === 'ReactQueryDebug')
    ) {
      onStoreChange();
    }
  };

  storageService.events.on('storageChange', handleStorageChange);

  return () => {
    storageService.events.off('storageChange', handleStorageChange);
  };
}

export function useDebugOptions(): DebugOptions {
  return useSyncExternalStore(
    subscribeToDebugOptions,
    getDebugOptionsSnapshot,
    getDebugOptionsSnapshot,
  );
}
