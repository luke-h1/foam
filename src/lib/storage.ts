import EventEmitter from 'eventemitter3';

import { storage } from '@app/lib/storageAdapter';
import type { StorageAdapter } from '@app/lib/storageAdapter.types';
import type { OpenStringUnion } from '@app/utils/typescript/openStringUnion';

export { storage };

export interface StorageSetterOptions {
  expiry?: Date;
}

export interface StorageItem<T = unknown> {
  expiry?: string;
  value: T;
}

export type AllowedKey = OpenStringUnion<
  | 'ReactQueryDebug'
  | 'previous_searches'
  | `appStoreLink_${string}`
  | `sevenTvUserCosmetics_${string}`
  | `sevenTvUserId_${string}`
>;

type NamespacePrefixes = 'seven_tv_cache';

export const NAMESPACE = 'FOAM_V1';

export const SEVEN_TV_CACHE_NAMESPACE: NamespacePrefixes = 'seven_tv_cache';

interface StorageKeyChangeEvent {
  kind: 'set' | 'remove';
  key: AllowedKey;
  namespace?: NamespacePrefixes;
}

interface StorageNamespaceClearEvent {
  kind: 'clearNamespace';
  namespace: NamespacePrefixes;
}

interface StorageClearAllEvent {
  kind: 'clearAll';
}

export type StorageChangeEvent =
  | StorageKeyChangeEvent
  | StorageNamespaceClearEvent
  | StorageClearAllEvent;

interface StorageEvents {
  storageChange: (event: StorageChangeEvent) => void;
}

const adapter: StorageAdapter = storage;

const storageEvents = new EventEmitter<StorageEvents>();

const namespaceKey = (key: AllowedKey, namespacePrefix?: NamespacePrefixes) => {
  if (namespacePrefix) {
    return `${NAMESPACE}_${namespacePrefix}_${key}`;
  }

  return `${NAMESPACE}_${key}`;
};

const isStorageItemExpired = (item: StorageItem): boolean =>
  item.expiry !== undefined && new Date() >= new Date(item.expiry);

function parseStorageItem<T>(raw: string): StorageItem<T> | null {
  let parsed: unknown;

  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }

  if (
    !(parsed instanceof Object) ||
    Array.isArray(parsed) ||
    !Object.hasOwn(parsed, 'value')
  ) {
    return null;
  }

  // SAFETY: storageService.set wrote this key as a JSON StorageItem; T is the caller's declared value contract.
  return parsed as StorageItem<T>;
}

const removeKeysWithPrefix = (prefix: string): void => {
  for (const key of adapter.getAllKeys()) {
    if (key.startsWith(prefix)) {
      adapter.remove(key);
    }
  }
};

const removeKey = (key: AllowedKey, namespacePrefix?: NamespacePrefixes) => {
  adapter.remove(namespaceKey(key, namespacePrefix));

  storageEvents.emit('storageChange', {
    kind: 'remove',
    key,
    namespace: namespacePrefix,
  });
};

export const storageService = {
  events: storageEvents,

  getString<T = unknown>(
    key: AllowedKey,
    namespacePrefix?: NamespacePrefixes,
  ): T | null {
    const raw = adapter.getString(namespaceKey(key, namespacePrefix));

    if (!raw) {
      return null;
    }

    const item = parseStorageItem<T>(raw);

    if (!item) {
      return null;
    }

    if (isStorageItemExpired(item)) {
      removeKey(key, namespacePrefix);
      return null;
    }

    return item.value;
  },

  set<T>(
    key: AllowedKey,
    value: T,
    namespacePrefix?: NamespacePrefixes,
    options: StorageSetterOptions = {},
  ): void {
    const { expiry } = options;

    if (expiry && expiry <= new Date()) {
      return;
    }

    const item: StorageItem<T> = expiry
      ? { value, expiry: expiry.toISOString() }
      : { value };

    adapter.set(namespaceKey(key, namespacePrefix), JSON.stringify(item));

    storageEvents.emit('storageChange', {
      kind: 'set',
      key,
      namespace: namespacePrefix,
    });
  },

  delete: removeKey,

  remove: removeKey,

  clear(): void {
    removeKeysWithPrefix(NAMESPACE);
    storageEvents.emit('storageChange', { kind: 'clearAll' });
  },

  getAllKeys(namespacePrefix?: NamespacePrefixes): string[] {
    const prefix = namespacePrefix
      ? `${NAMESPACE}_${namespacePrefix}`
      : NAMESPACE;

    return adapter.getAllKeys().filter(key => key.startsWith(prefix));
  },

  clearExpired(): void {
    for (const key of storageService.getAllKeys()) {
      const raw = adapter.getString(key);
      const item = raw ? parseStorageItem(raw) : null;

      if (item && isStorageItemExpired(item)) {
        adapter.remove(key);
      }
    }
  },

  clearNamespace(namespacePrefix: NamespacePrefixes, keyPrefix = ''): void {
    removeKeysWithPrefix(`${NAMESPACE}_${namespacePrefix}_${keyPrefix}`);

    storageEvents.emit('storageChange', {
      kind: 'clearNamespace',
      namespace: namespacePrefix,
    });
  },
} as const;
