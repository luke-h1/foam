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

  get<T>(key: AllowedKey): T | null {
    const namespacedKey = namespaceKey(key);
    const item = storage.getString(namespacedKey);

    if (!item) {
      return null;
    }

    const { value, expiry } = JSON.parse(item) as StorageItem<T>;

    if (expiry && new Date() >= new Date(expiry)) {
      this.remove(key);
      return null;
    }
    return value;
  },

  multiGet<T extends readonly unknown[]>(keys: {
    [K in keyof T]: AllowedKey;
  }): { [K in keyof T]: [string, T[K] | null] } {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return keys.map((key, index) => {
      const namespacedKey = namespaceKey(key);
      const item = storage.getString(namespacedKey);
      if (!item) {
        return [key, null] as [string, T[typeof index] | null];
      }
      const { value: parsedValue } = JSON.parse(item) as StorageItem<
        T[typeof index]
      >;
      return [key, parsedValue] as [string, T[typeof index] | null];
    }) as { [K in keyof T]: [string, T[K] | null] };
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
