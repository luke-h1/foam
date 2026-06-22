import * as FileSystem from 'expo-file-system/legacy';

import { logger } from '@app/utils/logger';

const KAPPA_UPLOAD_URL = 'https://kappa.lol/api/upload';

export interface KappaUploadAsset {
  uri: string;
  fileName?: string;
  mimeType?: string;
}

export interface KappaUploadResult {
  link: string;
}

export const kappaService = {
  upload: async (asset: KappaUploadAsset): Promise<KappaUploadResult> => {
    const mimeType = asset.mimeType ?? 'image/jpeg';

    const response = await FileSystem.uploadAsync(KAPPA_UPLOAD_URL, asset.uri, {
      httpMethod: 'POST',
      uploadType: FileSystem.FileSystemUploadType.MULTIPART,
      fieldName: 'file',
      mimeType,
    });

    if (response.status < 200 || response.status >= 300) {
      logger.chat.error('[kappa] upload failed', { status: response.status });
      throw new Error(`kappa upload failed with status ${response.status}`);
    }

    let data: { link?: string; url?: string };
    try {
      data = JSON.parse(response.body) as { link?: string; url?: string };
    } catch {
      logger.chat.error('[kappa] upload response was not valid json', {
        body: response.body?.slice(0, 200),
      });
      throw new Error('kappa upload response was not valid json');
    }

    const link = data.link ?? data.url;

    if (!link) {
      logger.chat.error('[kappa] upload response missing link', {
        response: data,
      });
      throw new Error('kappa upload response did not include a link');
    }

    return { link };
  },
};
