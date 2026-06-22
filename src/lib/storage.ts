import { createMMKV } from 'react-native-mmkv';

import EventEmitter from 'eventemitter3';

import { OpenStringUnion } from '@app/utils/typescript/OpenStringUnion';

export type StorageSetterOptions = {
  expiry?: Date;
};

export type StorageItem<T = unknown> = {
  expiry?: string;
  value: T;
};

export type AllowedKey = OpenStringUnion<
  | 'ReactQueryDebug'
  | 'previous_searches'
  | `appStoreLink_${string}`
  | `sevenTvUserCosmetics_${string}`
  | `sevenTvUserId_${string}`
>;

export const NAMESPACE = 'FOAM_V1';

const namespaceKey = (key: AllowedKey, namespacePrefix?: string) => {
  if (namespacePrefix) {
    return `${NAMESPACE}_${namespacePrefix}_${key}`;
  }
  return `${NAMESPACE}_${key}`;
};

const storageEvents = new EventEmitter();

export const storage = createMMKV({
  id: 'storageService',
  compareBeforeSet: true,
});

const isStorageItemExpired = (item: StorageItem): boolean =>
  item.expiry !== undefined && new Date() >= new Date(item.expiry);

const removeNamespacedKeys = (prefix: string): void => {
  for (const key of storage.getAllKeys()) {
    if (key.startsWith(prefix)) {
      storage.remove(key);
    }
  }
};

type NamespacePrefixes = 'image_cache' | 'seven_tv_cache';

export const storageService = {
  events: storageEvents,

  getString<T = unknown>(
    key: AllowedKey,
    namespacePrefix?: NamespacePrefixes,
  ): T | null {
    const item = storage.getString(namespaceKey(key, namespacePrefix));
    if (!item) {
      return null;
    }

    const parsed = JSON.parse(item) as StorageItem<T>;

    if (isStorageItemExpired(parsed)) {
      storageService.remove(key);
      return null;
    }

    return parsed.value;
  },

  set(
    key: AllowedKey,
    value: unknown,
    namespacePrefix?: NamespacePrefixes,
    options: StorageSetterOptions = {},
  ): void {
    const { expiry } = options;

    let item: StorageItem = { value };

    if (expiry) {
      if (expiry <= new Date()) {
        return;
      }

      item = { value, expiry: expiry.toISOString() };
    }

    const namespacedKey = namespaceKey(key, namespacePrefix);
    storage.set(namespacedKey, JSON.stringify(item));
    storageEvents.emit('storageChange', key);
  },
  delete(key: AllowedKey, namespacePrefix?: NamespacePrefixes): void {
    storage.remove(namespaceKey(key, namespacePrefix));
    storageEvents.emit('storageChange', key);
  },
  remove(key: AllowedKey, namespacePrefix?: NamespacePrefixes): void {
    const namespacedKey = namespaceKey(key, namespacePrefix);
    storage.remove(namespacedKey);
    storageEvents.emit('storageChange', key);
  },

  clear(): void {
    removeNamespacedKeys(NAMESPACE);
    storageEvents.emit('storageChange', 'all');
  },

  getAllKeys(namespacePrefix?: NamespacePrefixes): string[] {
    return storage
      .getAllKeys()
      .filter(key => key.startsWith(`${NAMESPACE}_${namespacePrefix}`));
  },

  clearExpired(): void {
    storageService.getAllKeys().forEach(key => {
      const item = storage.getString(key);
      if (item && isStorageItemExpired(JSON.parse(item) as StorageItem)) {
        storage.remove(key);
      }
    });
  },
  clearImageCache() {
    removeNamespacedKeys(`${NAMESPACE}_image_cache`);
    storageEvents.emit('storageChange', 'image_cache');
  },
  clearNamespace(namespacePrefix: NamespacePrefixes, keyPrefix = '') {
    removeNamespacedKeys(`${NAMESPACE}_${namespacePrefix}_${keyPrefix}`);
    storageEvents.emit('storageChange', namespacePrefix);
  },
} as const;
