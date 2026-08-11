import { useCallback, useState } from 'react';

import * as ImagePicker from 'expo-image-picker';
import { toast } from 'sonner-native';

import { kappaService } from '@app/services/kappa-service';
import { logger } from '@app/utils/logger';

/**
 * Lets the user pick an image from their library, uploads it to kappa.lol,
 * and hands the resulting public URL back so it can be inserted into the
 * chat composer.
 */
export function useChatImageUpload(onUploaded: (url: string) => void) {
  const [isUploading, setIsUploading] = useState(false);

  const pickAndUpload = useCallback(async () => {
    if (isUploading) {
      return;
    }

    let result: ImagePicker.ImagePickerResult;
    try {
      result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.8,
      });
    } catch (error) {
      logger.chat.error('[kappa] image picker failed', { error });
      toast.error("Couldn't upload that image. Please try again.");
      return;
    }

    const asset = result.canceled ? undefined : result.assets[0];
    if (!asset) {
      return;
    }

    setIsUploading(true);
    try {
      const { link } = await kappaService.upload({
        uri: asset.uri,
        fileName: asset.fileName ?? undefined,
        mimeType: asset.mimeType ?? undefined,
      });
      onUploaded(link);
      toast.success('Image uploaded');
    } catch (error) {
      logger.chat.error('[kappa] chat image upload failed', { error });
      toast.error("Couldn't upload that image. Please try again.");
    } finally {
      setIsUploading(false);
    }
  }, [isUploading, onUploaded]);

  return { isUploading, pickAndUpload };
}
