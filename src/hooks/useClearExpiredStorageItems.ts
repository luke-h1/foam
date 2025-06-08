import { storageService } from '@app/services';
import { useEffect } from 'react';

export function useClearExpiredStorageItems() {
  useEffect(() => {
    (() => {
      storageService.clearExpired();
    })();
  }, []);
}
