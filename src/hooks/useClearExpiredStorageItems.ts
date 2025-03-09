import { storageService } from '@app/services';
import { useEffect } from 'react';

export function useClearExpiredStorageItems() {
  useEffect(() => {
    (async () => {
      await storageService.clearExpired();
    })();
  }, []);
}
