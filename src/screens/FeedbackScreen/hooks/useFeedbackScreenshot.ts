import { useCallback, useState } from 'react';

import { File } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { toast } from 'sonner-native';

import i18next from '@app/i18n/i18next';
import type { FeedbackAttachment } from '@app/lib/sentry';
import { logger } from '@app/utils/logger';

/**
 * Cap well below Sentry's 20MB attachment limit so a feedback envelope
 * never balloons the offline cache (see the 80MB-envelope OOM incident).
 */
const MAX_SCREENSHOT_BYTES = 5 * 1024 * 1024;

export interface FeedbackScreenshot {
  uri: string;
  attachment: FeedbackAttachment;
}

/**
 * Lets the user pick an image from their library and holds it as a
 * Sentry feedback attachment until the feedback form is submitted.
 */
export function useFeedbackScreenshot() {
  const [screenshot, setScreenshot] = useState<FeedbackScreenshot | null>(null);

  const pickScreenshot = useCallback(async () => {
    let result: ImagePicker.ImagePickerResult;
    try {
      result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.7,
      });
    } catch (error) {
      logger.main.error('[feedback] screenshot picker failed', { error });
      toast.error(i18next.t('feedback:screenshotPickFailed'));
      return;
    }

    const asset = result.canceled ? undefined : result.assets[0];
    if (!asset) {
      return;
    }

    try {
      const file = new File(asset.uri);
      if ((file.size ?? 0) > MAX_SCREENSHOT_BYTES) {
        toast.error(i18next.t('feedback:screenshotTooLarge'));
        return;
      }

      const data = await file.bytes();
      setScreenshot({
        uri: asset.uri,
        attachment: {
          filename: asset.fileName ?? 'screenshot.jpg',
          data,
          contentType: asset.mimeType ?? 'image/jpeg',
        },
      });
    } catch (error) {
      logger.main.error('[feedback] reading screenshot failed', { error });
      toast.error(i18next.t('feedback:screenshotPickFailed'));
    }
  }, []);

  const clearScreenshot = useCallback(() => {
    setScreenshot(null);
  }, []);

  return { screenshot, pickScreenshot, clearScreenshot };
}
