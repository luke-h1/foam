import { useEffect } from 'react';
import { InteractionManager } from 'react-native';

import { storageService } from '@app/lib/storage';

export function useClearExpiredStorageItems() {
  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      storageService.clearExpired();
    });

    return () => {
      task.cancel();
    };
  }, []);
}
