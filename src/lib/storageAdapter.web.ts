import type { StorageAdapter } from '@app/lib/storageAdapter.types';

function withLocalStorage<T>(
  run: (localStorage: Storage) => T,
  fallback: T,
): T {
  try {
    const localStorage = globalThis.localStorage;

    return localStorage ? run(localStorage) : fallback;
  } catch {
    return fallback;
  }
}

function listKeys(localStorage: Storage): string[] {
  const keys: string[] = [];

  for (let index = 0; index < localStorage.length; index++) {
    const key = localStorage.key(index);

    if (key !== null) {
      keys.push(key);
    }
  }

  return keys;
}

export const storage: StorageAdapter = {
  getString(key) {
    return withLocalStorage(
      localStorage => localStorage.getItem(key) ?? undefined,
      undefined,
    );
  },
  set(key, value) {
    withLocalStorage(
      localStorage => localStorage.setItem(key, value),
      undefined,
    );
  },
  remove(key) {
    withLocalStorage(localStorage => localStorage.removeItem(key), undefined);
  },
  getAllKeys() {
    return withLocalStorage(listKeys, []);
  },
};
