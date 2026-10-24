import { useEffect } from 'react';

import { storageService } from '@app/lib/storage';
import { runWhenIdle } from '@app/utils/run-when-idle';

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
