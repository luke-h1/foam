import type { SevenTvUserIdCacheStorage } from '@app/utils/seventv/sevenTvUserIdCache';

type StoredEntry = {
  expiry?: string;
  value: unknown;
};

export type FakeSevenTvCacheStorage = SevenTvUserIdCacheStorage & {
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
      return entry.value as T;
    },
    set(key, value, namespacePrefix, options = {}) {
      const { expiry } = options;
      if (expiry && expiry <= new Date()) {
        return;
      }
      backing.set(namespaceKey(key, namespacePrefix), {
        value,
        ...(expiry ? { expiry: expiry.toISOString() } : {}),
      });
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
