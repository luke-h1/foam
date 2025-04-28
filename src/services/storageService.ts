import EventEmitter from 'eventemitter3';
import { MMKV } from 'react-native-mmkv';

export type StorageSetterOptions = {
  expiry?: Date;
};

export type StorageItem<T = unknown> = {
  expiry?: string;
  value: T;
};

export type AllowedKey =
  | 'ReactQueryDebug'
  | 'foam_stacked_cards'
  | 'previous_searches';

const NAMESPACE = 'FOAM_V1';

const namespaceKey = (key: AllowedKey) => `${NAMESPACE}_${key}`;

const storageEvents = new EventEmitter();

const storage = new MMKV({
  id: 'storageService',
});

export const storageService = {
  events: storageEvents,

  getString<T>(key: AllowedKey): T | null {
    const item = storage.getString(namespaceKey(key));

    if (!item) {
      return null;
    }

    const { value, expiry } = JSON.parse(item) as StorageItem<T>;

    if (expiry && new Date() >= new Date(expiry)) {
      this.delete(key);
      return null;
    }

    return value;
  },


  async set(
    key: AllowedKey,
    value: unknown,
    options: StorageSetterOptions = {},
  ): Promise<void> {
    const { expiry } = options;

    let item: StorageItem = { value };

    if (expiry) {
      if (expiry <= new Date()) {
        return;
      }

      item = { value, expiry: expiry.toISOString() };
    }

    const namespacedKey = namespaceKey(key);
    storage.set(namespacedKey, JSON.stringify(item));
    storageEvents.emit('storageChange', key);
  },
  delete(key: AllowedKey): void {
    storage.delete(namespaceKey(key));
    storageEvents.emit('storageChange', key);
  },
  remove(key: AllowedKey): void {
    const namespacedKey = namespaceKey(key);
    storage.delete(namespacedKey);
    storageEvents.emit('storageChange', key);
  },

  clear(): void {
    const keys = storage.getAllKeys().filter(key => key.startsWith(NAMESPACE));
    keys.forEach(key => storage.delete(key));
    storageEvents.emit('storageChange', 'all');
  },

  getAllKeys() {
    return storage.getAllKeys().filter(key => key.startsWith(NAMESPACE));
  },

  clearExpired(): void {
    const keys = this.getAllKeys();

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
} as const;
