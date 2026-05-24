import { Platform } from 'react-native';
import type {
  ObservablePersistLocal,
  PersistOptionsLocal,
} from '@legendapp/state';
import {
  configureObservablePersistence,
  mapPersistences,
} from '@legendapp/state/persist';
import { ObservablePersistMMKV } from '@legendapp/state/persist-plugins/mmkv';
import { ObservablePersistIndexedDbJson } from './observablePersistIndexedDbJson';

let initialized = false;

export const CHAT_STORE_PERSISTENCE_KEY = 'chat-store-v2';
export const PREFERENCES_PERSISTENCE_KEY = 'FOAM_V1_PREFERENCES';

const WEB_OBSERVABLE_DATABASE_NAME = 'foam-observable-cache';
const WEB_OBSERVABLE_DATABASE_VERSION = 1;
const WEB_OBSERVABLE_TABLE_NAMES = [
  CHAT_STORE_PERSISTENCE_KEY,
  PREFERENCES_PERSISTENCE_KEY,
];

function clearLegacyWebLocalStorageCaches(): void {
  if (globalThis.localStorage === undefined) {
    return;
  }

  try {
    globalThis.localStorage.removeItem(CHAT_STORE_PERSISTENCE_KEY);
    globalThis.localStorage.removeItem(`${CHAT_STORE_PERSISTENCE_KEY}__m`);

    Object.keys(globalThis.localStorage)
      .filter(key => key.startsWith('query-cache-'))
      .forEach(key => globalThis.localStorage.removeItem(key));
  } catch {
    // localStorage can be unavailable or already over quota in private modes.
  }
}

export function createObservablePersistenceLocalConfig<T>(
  name: string,
): PersistOptionsLocal<T> {
  return {
    name,
    indexedDB: {
      itemID: 'state',
    },
  };
}

export async function clearChatStorePersistence(): Promise<void> {
  ensureObservablePersistenceConfig();

  const config = createObservablePersistenceLocalConfig(
    CHAT_STORE_PERSISTENCE_KEY,
  );
  const pluginClass =
    Platform.OS === 'web'
      ? ObservablePersistIndexedDbJson
      : ObservablePersistMMKV;
  const entry = mapPersistences.get(pluginClass);

  if (!entry?.persist) {
    return;
  }

  const persist = entry.persist as ObservablePersistLocal;
  await Promise.all([
    persist.deleteTable(CHAT_STORE_PERSISTENCE_KEY, config),
    persist.deleteMetadata(CHAT_STORE_PERSISTENCE_KEY, config),
  ]);
}

export function ensureObservablePersistenceConfig(): void {
  if (initialized) {
    return;
  }

  initialized = true;

  if (Platform.OS === 'web') {
    clearLegacyWebLocalStorageCaches();

    configureObservablePersistence({
      pluginLocal: ObservablePersistIndexedDbJson,
      localOptions: {
        indexedDB: {
          databaseName: WEB_OBSERVABLE_DATABASE_NAME,
          version: WEB_OBSERVABLE_DATABASE_VERSION,
          tableNames: WEB_OBSERVABLE_TABLE_NAMES,
        },
      },
    });
    return;
  }

  configureObservablePersistence({
    pluginLocal: ObservablePersistMMKV,
  });
}
