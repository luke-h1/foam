import type {
  PersistedClient,
  Persister,
} from '@tanstack/react-query-persist-client';
import { createMMKV } from 'react-native-mmkv';

export function createQueryPersister(key: string): Persister {
  const storage = createMMKV({ id: `rq-cache-${key}` });

  return {
    persistClient: (client: PersistedClient) => {
      try {
        storage.set(key, JSON.stringify(client));
      } catch {
        // Storage quota exceeded — evict and let next persist succeed
        storage.remove(key);
      }
    },
    restoreClient: () => {
      const raw = storage.getString(key);
      if (!raw) return undefined;
      try {
        return JSON.parse(raw) as PersistedClient;
      } catch {
        storage.remove(key);
        return undefined;
      }
    },
    removeClient: () => {
      storage.remove(key);
    },
  };
}
