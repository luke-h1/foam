import type { SevenTvUserCacheStorage } from '@app/utils/seventv/sevenTvUserCache';

type StoredEntry = {
  expiry?: string;
  value: unknown;
};

export type FakeSevenTvCacheStorage = SevenTvUserCacheStorage & {
  backing: Map<string, StoredEntry>;
};

export function createFakeStorage(): FakeSevenTvCacheStorage {
  const backing = new Map<string, StoredEntry>();

  const namespaceKey = (key: string, namespacePrefix?: 'seven_tv_cache') =>
    namespacePrefix ? `${namespacePrefix}_${key}` : key;

  return {
    backing,
    getString<T>(key: string, namespacePrefix?: 'seven_tv_cache'): T | null {
      const namespacedKey = namespaceKey(key, namespacePrefix);
      const entry = backing.get(namespacedKey);
      if (!entry) {
        return null;
      }
      if (entry.expiry !== undefined && new Date() >= new Date(entry.expiry)) {
        backing.delete(namespacedKey);
        return null;
      }
      // SAFETY: the fake hands back exactly what set() stored; tests read a key with the same T they wrote
      return entry.value as T;
    },
    set(key, value, namespacePrefix, options = {}) {
      const { expiry } = options;
      if (expiry && expiry <= new Date()) {
        return;
      }
      const entry: StoredEntry = { value };
      if (expiry) {
        entry.expiry = expiry.toISOString();
      }
      backing.set(namespaceKey(key, namespacePrefix), entry);
    },
    delete(key, namespacePrefix) {
      backing.delete(namespaceKey(key, namespacePrefix));
    },
    clearNamespace(namespacePrefix, keyPrefix = '') {
      const prefix = `${namespacePrefix}_${keyPrefix}`;
      for (const key of [...backing.keys()]) {
        if (key.startsWith(prefix)) {
          backing.delete(key);
        }
      }
    },
  };
}
