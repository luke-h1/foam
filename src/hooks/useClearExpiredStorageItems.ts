import { storageService } from '@app/lib/storage';
import { useEffect } from 'react';
import { InteractionManager } from 'react-native';

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
