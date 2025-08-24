import { NAMESPACE } from '@app/services';
import { MMKV } from 'react-native-mmkv';

const storage = new MMKV({
  id: `${NAMESPACE}_persist_storage`,
});

/**
 * Custom storage service that has an API
 * which is compatible with Zustand's `persist`.
 * Handles reading and writing to devices storage via
 * MMKV
 */

export const zustandStorage = {
  async getItem<T>(key: string): Promise<T | null> {
    return new Promise(resolve => {
      try {
        const value = storage.getString(key);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        resolve(value ? JSON.parse(value) || null : null);
      } catch {
        resolve(null);
      }
    });
  },

  async setItem<T>(key: string, value: T): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        storage.set(key, JSON.stringify(value));
        resolve();
      } catch (error) {
        const typedError =
          error instanceof Error
            ? error.message
            : 'Unknown setItem write failure';

        reject(new Error(typedError));
      }
    });
  },

  async removeItem(key: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        storage.delete(key);
        resolve();
      } catch (error) {
        const typedError =
          error instanceof Error
            ? error.message
            : 'Unknown deleteItem write failure';

        reject(new Error(typedError));
      }
    });
  },

  length() {
    return storage.getAllKeys().length;
  },

  clear() {
    return storage.clearAll();
  },
};
