import { useEffect } from 'react';

import { storageService } from '@app/lib/storage';
import { runWhenIdle } from '@app/utils/runWhenIdle';

export function useClearExpiredStorageItems() {
  useEffect(() => {
    const task = runWhenIdle(() => {
      storageService.clearExpired();
    });

    return () => {
      task.cancel();
    };
  }, []);
}
