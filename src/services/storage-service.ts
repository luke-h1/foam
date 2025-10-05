import { OpenStringUnion } from '@app/utils';
import EventEmitter from 'eventemitter3';
import { MMKV } from 'react-native-mmkv';

export type StorageSetterOptions = {
  expiry?: Date;
};

export type StorageItem<T = unknown> = {
  expiry?: string;
  value: T;
};

export type AllowedKey = OpenStringUnion<
  | 'ReactQueryDebug'
  | 'foam_stacked_cards'
  | 'previous_searches'
  | `appStoreLink_${string}`
>;

export const NAMESPACE = 'FOAM_V1';

const namespaceKey = (key: AllowedKey, namespacePrefix?: string) => {
  if (namespacePrefix) {
    return `${NAMESPACE}_${namespacePrefix}_${key}`;
  }
  return `${NAMESPACE}_${key}`;
};

const storageEvents = new EventEmitter();

const storage = new MMKV({
  id: 'storageService',
});

type NamespacePrefixes = 'image_cache';

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

    const { value, expiry } = JSON.parse(item) as StorageItem<T>;

    if (expiry && new Date() >= new Date(expiry)) {
      storageService.delete(key);
      return null;
    }

    return value;
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
    storage.delete(namespaceKey(key, namespacePrefix));
    storageEvents.emit('storageChange', key);
  },
  remove(key: AllowedKey, namespacePrefix?: NamespacePrefixes): void {
    const namespacedKey = namespaceKey(key, namespacePrefix);
    storage.delete(namespacedKey);
    storageEvents.emit('storageChange', key);
  },

  clear(): void {
    const keys = storage.getAllKeys().filter(key => key.startsWith(NAMESPACE));
    keys.forEach(key => storage.delete(key));
    storageEvents.emit('storageChange', 'all');
  },

  getAllKeys(namespacePrefix?: NamespacePrefixes): string[] {
    return storage
      .getAllKeys()
      .filter(key => key.startsWith(`${NAMESPACE}_${namespacePrefix}`));
  },

  clearExpired(): void {
    const keys = storageService.getAllKeys();

    keys.forEach(key => {
      const item = storage.getString(key);
      if (item) {
        const { expiry } = JSON.parse(item) as StorageItem;
        if (expiry && new Date() >= new Date(expiry)) {
          storage.delete(key);
        }
      }
    });
  },
  clearImageCache() {
    const keys = storage
      .getAllKeys()
      .filter(key => key.startsWith(`${NAMESPACE}_image_cache`));
    keys.forEach(key => storage.delete(key));
    storageEvents.emit('storageChange', 'image_cache');
  },
} as const;
