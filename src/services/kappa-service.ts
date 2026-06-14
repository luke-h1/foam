import { logger } from '@app/utils/logger';

/**
 * kappa.lol is a free image host popular in the Twitch community. Its upload
 * endpoint accepts a multipart `file` field and responds with `{ link }`.
 */
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
    const formData = new FormData();
    const fileName = asset.fileName ?? `foam-${Date.now()}.jpg`;
    const type = asset.mimeType ?? 'image/jpeg';

    // React Native's FormData accepts this { uri, name, type } file shape.
    formData.append('file', {
      uri: asset.uri,
      name: fileName,
      type,
    } as unknown as Blob);

    const response = await fetch(KAPPA_UPLOAD_URL, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      logger.chat.error('[kappa] upload failed', response.status);
      throw new Error(`kappa upload failed with status ${response.status}`);
    }

    const data = (await response.json()) as { link?: string; url?: string };
    const link = data.link ?? data.url;

    if (!link) {
      logger.chat.error('[kappa] upload response missing link', data);
      throw new Error('kappa upload response did not include a link');
    }

    return { link };
  },
};
