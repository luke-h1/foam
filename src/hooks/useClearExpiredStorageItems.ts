import { storageService } from '@app/services/storage-service';
import { useEffect } from 'react';

export function useClearExpiredStorageItems() {
  useEffect(() => {
    (() => {
      storageService.clearExpired();
    })();
  }, []);
}
