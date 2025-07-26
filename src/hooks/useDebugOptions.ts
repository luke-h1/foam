import { AllowedKey, storageService } from '@app/services';
import { useEffect, useState } from 'react';

type DebugOptions = {
  [key in AllowedKey]?: { enabled: boolean };
};

export function useDebugOptions() {
  const fetchDebugOptions = () => {
    const keys: AllowedKey[] = ['ReactQueryDebug'];
    const options: DebugOptions = {};

    keys.forEach(key => {
      const value = storageService.getString<boolean>(key);
      options[key] = { enabled: value === true };
    });
    return options;
  };

  const [debugOptions, setDebugOptions] =
    useState<DebugOptions>(fetchDebugOptions());

  useEffect(() => {
    void storageService.clearExpired();

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
