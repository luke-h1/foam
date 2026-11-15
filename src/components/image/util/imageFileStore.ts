import {
  cacheImageFromUrl,
  getCachedImageUri,
} from '@app/utils/image/imageCache';

export const imageFileStore = {
  enabled: process.env.NODE_ENV !== 'test',
  cacheImageFromUrl,
  getCachedImageUri,
};
