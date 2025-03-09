import { AllowedKey, storageService } from '@app/services';
import { useEffect, useState } from 'react';

type DebugOptions = {
  [key in AllowedKey]?: { enabled: boolean };
};

export function useDebugOptions() {
  const [debugOptions, setDebugOptions] = useState<DebugOptions>({});

  const fetchDebugOptions = async () => {
    const result = await storageService.multiGet<[boolean]>([
      'ReactQueryDebug',
    ]);
    const options = result.reduce((acc, [key, value]) => {
      acc[key as AllowedKey] = { enabled: value === true };
      return acc;
    }, {} as DebugOptions);
    setDebugOptions(options);
  };

  useEffect(() => {
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
