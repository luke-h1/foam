import { AllowedKey, storageService } from '@app/lib/storage';
import { useEffect, useState } from 'react';

type DebugOptions = {
  [key in AllowedKey]?: { enabled: boolean };
};

function fetchDebugOptions(): DebugOptions {
  const keys: AllowedKey[] = ['ReactQueryDebug'];
  const options: DebugOptions = {};

  keys.forEach(key => {
    const value = storageService.getString<boolean>(key);
    options[key] = { enabled: value === true };
  });
  return options;
}

export function useDebugOptions() {
  const [debugOptions, setDebugOptions] = useState<DebugOptions>(() =>
    fetchDebugOptions(),
  );

  useEffect(() => {
    storageService.clearExpired();

    const handleStorageChange = () => {
      setDebugOptions(fetchDebugOptions());
    };

    storageService.events.on('storageChange', handleStorageChange);

    return () => {
      storageService.events.off('storageChange', handleStorageChange);
    };
  }, []);

  return debugOptions;
}
