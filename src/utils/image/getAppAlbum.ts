import * as MediaLibrary from 'expo-media-library';

export async function getAppAlbum() {
  const name = 'foam';

  const exists = await MediaLibrary.getAlbumAsync(name);

  if (exists) {
    return exists;
  }

  return MediaLibrary.createAlbumAsync(name);
}
