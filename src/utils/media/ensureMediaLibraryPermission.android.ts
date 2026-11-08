import * as MediaLibrary from 'expo-media-library';

import { presentMediaPermissionPrompt } from '@app/store/overlays/media-permission-store';
import { MEDIA_PERMISSION_PROMPT } from '@app/utils/media/constants';

export async function ensureMediaLibraryPermission(): Promise<boolean> {
  const { granted } = await MediaLibrary.requestPermissionsAsync();

  if (granted) {
    return true;
  }

  await presentMediaPermissionPrompt(MEDIA_PERMISSION_PROMPT);

  return false;
}
