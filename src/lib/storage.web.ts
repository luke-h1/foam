import { OpenStringUnion } from '@app/utils/typescript/OpenStringUnion';
import EventEmitter from 'eventemitter3';

export type StorageSetterOptions = {
  expiry?: Date;
};

export type StorageItem<T = unknown> = {
  expiry?: string;
  value: T;
};

export type AllowedKey = OpenStringUnion<
  'ReactQueryDebug' | 'previous_searches' | `appStoreLink_${string}`
>;

export const NAMESPACE = 'FOAM_V1';

const namespaceKey = (key: AllowedKey, namespacePrefix?: NamespacePrefixes) => {
  if (namespacePrefix) {
    return `${NAMESPACE}_${namespacePrefix}_${key}`;
  }
  return `${NAMESPACE}_${key}`;
};

const storageEvents = new EventEmitter();

type NamespacePrefixes = 'image_cache';

const safeLocalStorage = {
  getItem(key: string): string | null {
    try {
      return globalThis.localStorage?.getItem(key) ?? null;
    } catch {
      return null;
    }
  },
  setItem(key: string, value: string): void {
    try {
      globalThis.localStorage?.setItem(key, value);
    } catch {
      // Ignore unavailable storage on web.
    }
  },
  removeItem(key: string): void {
    try {
      globalThis.localStorage?.removeItem(key);
    } catch {
      // Ignore unavailable storage on web.
    }
  },
  keys(): string[] {
    try {
      return Object.keys(globalThis.localStorage ?? {});
    } catch {
      return [];
    }
  },
};

export const storage = {
  getString(key: string): string | undefined {
    return safeLocalStorage.getItem(key) ?? undefined;
  },
  set(key: string, value: string): void {
    safeLocalStorage.setItem(key, value);
  },
  remove(key: string): void {
    safeLocalStorage.removeItem(key);
  },
  getAllKeys(): string[] {
    return safeLocalStorage.keys();
  },
};

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
      storageService.remove(key);
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
    storage.remove(namespaceKey(key, namespacePrefix));
    storageEvents.emit('storageChange', key);
  },
  remove(key: AllowedKey, namespacePrefix?: NamespacePrefixes): void {
    const namespacedKey = namespaceKey(key, namespacePrefix);
    storage.remove(namespacedKey);
    storageEvents.emit('storageChange', key);
  },

  clear(): void {
    const keys = storage.getAllKeys().filter(key => key.startsWith(NAMESPACE));
    keys.forEach(key => storage.remove(key));
    storageEvents.emit('storageChange', 'all');
  },

  getAllKeys(namespacePrefix?: NamespacePrefixes): string[] {
    const prefix = namespacePrefix
      ? `${NAMESPACE}_${namespacePrefix}`
      : NAMESPACE;
    return storage.getAllKeys().filter(key => key.startsWith(prefix));
  },

  clearExpired(): void {
    const keys = storageService.getAllKeys();

    keys.forEach(key => {
      const item = storage.getString(key);
      if (item) {
        const { expiry } = JSON.parse(item) as StorageItem;
        if (expiry && new Date() >= new Date(expiry)) {
          storage.remove(key);
        }
      }
    });
  },
  clearImageCache() {
    const keys = storage
      .getAllKeys()
      .filter(key => key.startsWith(`${NAMESPACE}_image_cache`));
    keys.forEach(key => storage.remove(key));
    storageEvents.emit('storageChange', 'image_cache');
  },
} as const;
