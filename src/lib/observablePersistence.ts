import { Platform } from 'react-native';
import { configureObservablePersistence } from '@legendapp/state/persist';
import { ObservablePersistAsyncStorage } from '@legendapp/state/persist-plugins/async-storage';
import { ObservablePersistMMKV } from '@legendapp/state/persist-plugins/mmkv';
import AsyncStorage from '@react-native-async-storage/async-storage';

let initialized = false;

export function ensureObservablePersistenceConfig(): void {
  if (initialized) {
    return;
  }

  initialized = true;

  if (Platform.OS === 'web') {
    configureObservablePersistence({
      pluginLocal: ObservablePersistAsyncStorage,
      localOptions: {
        asyncStorage: {
          AsyncStorage,
        },
      },
    });
    return;
  }

  configureObservablePersistence({
    pluginLocal: ObservablePersistMMKV,
  });
}
