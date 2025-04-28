import { AllowedKey, storageService } from '@app/services';
import { useEffect, useState } from 'react';

type DebugOptions = {
  [key in AllowedKey]?: { enabled: boolean };
};

export function useDebugOptions() {
  const [debugOptions, setDebugOptions] = useState<DebugOptions>({});

  const fetchDebugOptions = () => {
    const keys: AllowedKey[] = ['ReactQueryDebug',];
    const options: DebugOptions = {};

    keys.forEach((key) => {
      const value = storageService.getString<boolean>(key);
      options[key] = { enabled: value === true };
    });
    setDebugOptions(options);
  };

  useEffect(() => {
    // eslint-disable-next-line no-void
    void storageService.clearExpired();

    fetchDebugOptions();

    const handleStorageChange = () => {
      fetchDebugOptions();
    };

    storageService.events.on('storageChange', handleStorageChange);

    return () => {
      storageService.events.off('storageChange', handleStorageChange);
    };
  }, []);

  return debugOptions;
}
