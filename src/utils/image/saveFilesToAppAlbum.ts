import { Album, Asset } from 'expo-media-library';

const APP_ALBUM_NAME = 'foam';

export async function saveFilesToAppAlbum(fileUris: string | string[]) {
  const uris = Array.isArray(fileUris) ? fileUris : [fileUris];

  if (!uris.length) {
    return;
  }

  const album = await Album.get(APP_ALBUM_NAME);

  if (!album) {
    await Album.create(APP_ALBUM_NAME, uris);
    return;
  }

  await Promise.all(uris.map(uri => Asset.create(uri, album)));
}
