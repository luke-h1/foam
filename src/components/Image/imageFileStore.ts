import {
  cacheImageFromUrl,
  getCachedImageUri,
} from '@app/utils/image/image-cache';

/**
 * Indirection over the file cache so tests can substitute it. The real store
 * touches MMKV and the filesystem, so Jest runs default it off; Image tests
 * flip `enabled` and swap the functions to exercise the wrapper's caching
 * rules instead of them being dead code under test.
 */
export const imageFileStore = {
  enabled: process.env.NODE_ENV !== 'test',
  cacheImageFromUrl,
  getCachedImageUri,
};
