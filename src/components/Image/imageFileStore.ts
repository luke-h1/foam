import {
  cacheImageFromUrl,
  getCachedImageUri,
} from '@app/utils/image/image-cache';

/**
 * Indirection over the file cache so tests can substitute it; Jest runs
 * default it off because the real store touches MMKV and the filesystem.
 */
export const imageFileStore = {
  enabled: process.env.NODE_ENV !== 'test',
  cacheImageFromUrl,
  getCachedImageUri,
};
