import { createMMKV } from 'react-native-mmkv';

export const storageMMKV = createMMKV({
  id: 'storageService',
  compareBeforeSet: true,
  mode: 'multi-process',
});

export const imageCacheManifestMMKV = createMMKV({
  id: 'image-cache-manifest',
  compareBeforeSet: true,
});

/**
 * Shared with Legend State ObservablePersistMMKV default instance.
 */
export const observablePersistMMKV = createMMKV({
  id: 'obsPersist',
});

export const rozeniteMmkvStorages = {
  storageService: storageMMKV,
  'image-cache-manifest': imageCacheManifestMMKV,
  obsPersist: observablePersistMMKV,
} as const;
