import { useSyncExternalStore } from 'react';

import { AllowedKey, storageService } from '@app/lib/storage';

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
  const handleStorageChange = (key: string) => {
    if (key === 'ReactQueryDebug' || key === 'all') {
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
