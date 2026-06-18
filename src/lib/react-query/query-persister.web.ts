import type {
  PersistedClient,
  Persister,
} from '@tanstack/react-query-persist-client';
import { logger } from '@app/utils/logger';

const DATABASE_NAME = 'foam-query-cache';
const DATABASE_VERSION = 1;
const STORE_NAME = 'query-cache';

type QueryCacheRecord = {
  id: string;
  value: PersistedClient;
};

let dbPromise: Promise<IDBDatabase | null> | undefined;

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function canUseIndexedDb(): boolean {
  return typeof indexedDB !== 'undefined';
}

function openDatabase(): Promise<IDBDatabase | null> {
  if (!canUseIndexedDb()) {
    return Promise.resolve(null);
  }

  if (!dbPromise) {
    dbPromise = new Promise<IDBDatabase | null>((resolve, reject) => {
      const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    }).catch(error => {
      logger.cache.warn('[query-cache] Failed to open IndexedDB cache', error);
      dbPromise = undefined;
      return null;
    });
  }

  return dbPromise;
}

async function getStore(
  mode: IDBTransactionMode,
): Promise<IDBObjectStore | null> {
  const db = await openDatabase();
  if (!db) {
    return null;
  }

  return db.transaction(STORE_NAME, mode).objectStore(STORE_NAME);
}

export function createQueryPersister(key: string): Persister {
  let memoryFallback: PersistedClient | undefined;

  return {
    async persistClient(persistedClient) {
      memoryFallback = persistedClient;

      const store = await getStore('readwrite');
      if (!store) {
        return;
      }

      await requestToPromise(
        store.put({
          id: key,
          value: persistedClient,
        } satisfies QueryCacheRecord),
      );
    },

    async restoreClient() {
      const store = await getStore('readonly');
      if (!store) {
        return memoryFallback;
      }

      const record = await requestToPromise<QueryCacheRecord | undefined>(
        store.get(key),
      );
      return record?.value ?? memoryFallback;
    },

    async removeClient() {
      memoryFallback = undefined;

      const store = await getStore('readwrite');
      if (!store) {
        return;
      }

      await requestToPromise(store.delete(key));
    },
  };
}
