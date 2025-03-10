import AsyncStorage from '@react-native-async-storage/async-storage';
import EventEmitter from 'eventemitter3';

export type StorageSetterOptions = {
  expiry?: Date;
};

export type StorageItem<T = unknown> = {
  expiry?: string;
  value: T;
};

export type AllowedKey = 'ReactQueryDebug';

const NAMESPACE = 'FOAM_V1';

const namespaceKey = (key: AllowedKey) => `${NAMESPACE}_${key}`;

const storageEvents = new EventEmitter();

export const storageService = {
  events: storageEvents,

  async get<T>(key: AllowedKey): Promise<T | null> {
    const item = await AsyncStorage.getItem(namespaceKey(key));

    if (!item) {
      return null;
    }

    const { value, expiry } = JSON.parse(item) as StorageItem<T>;

    if (expiry && new Date() >= new Date(expiry)) {
      await this.remove(key);
      return null;
    }
    return value;
  },

  async multiGet<T extends readonly unknown[]>(keys: {
    [K in keyof T]: AllowedKey;
  }): Promise<{ [K in keyof T]: [string, T[K] | null] }> {
    const namespacedKeys = keys.map(k => namespaceKey(k));
    const entries = await AsyncStorage.multiGet(namespacedKeys);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return entries.map(([key, value], index) => {
      const sanitisedKey = key.replace(`${NAMESPACE}_`, '');

      if (value === null) {
        return [sanitisedKey, null] as [string, T[typeof index] | null];
      }
      const { value: parsedValue } = JSON.parse(value) as StorageItem<
        T[typeof index]
      >;
      return [sanitisedKey, parsedValue] as [string, T[typeof index] | null];
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
      // don't bother setting in storage
      // as it would already be expired
      if (expiry <= new Date()) {
        // eslint-disable-next-line no-useless-return
        return;
      }

      item = { value, expiry: expiry.toISOString() };
    }

    await AsyncStorage.setItem(namespaceKey(key), JSON.stringify(item));
    storageEvents.emit('storageChange', key);
  },

  async remove(key: AllowedKey): Promise<void> {
    await AsyncStorage.removeItem(namespaceKey(key));
    storageEvents.emit('storageChange', key);
  },

  async clear(): Promise<void> {
    const keys = await AsyncStorage.getAllKeys();
    const namespacedKeys = keys.filter(key => key.startsWith(NAMESPACE));
    await AsyncStorage.multiRemove(namespacedKeys);
    storageEvents.emit('storageChange', 'all');
  },
  async getAllKeys() {
    const keys = await AsyncStorage.getAllKeys();
    return keys.filter(key => key.startsWith(NAMESPACE));
  },

  async clearExpired(): Promise<void> {
    const keys = await this.getAllKeys();
    const entries = await AsyncStorage.multiGet(keys);

    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    entries.forEach(async ([key, value]) => {
      if (!key.startsWith(NAMESPACE)) {
        return;
      }

      const { expiry } = JSON.parse(value as string) as StorageItem;

      if (expiry && new Date() >= new Date(expiry)) {
        await storageService.remove(
          key.replace(`${NAMESPACE}_`, '') as AllowedKey,
        );
      }
    });
  },
} as const;
