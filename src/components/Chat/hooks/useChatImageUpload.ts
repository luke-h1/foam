import i18next from '@app/i18n/i18next';
import { kappaService } from '@app/services/kappa-service';
import { logger } from '@app/utils/logger';
import * as ImagePicker from 'expo-image-picker';
import { useCallback, useState } from 'react';
import { toast } from 'sonner-native';

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

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      toast.error(i18next.t('chat:imageUpload.permissionDenied'));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });

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
      toast.success(i18next.t('chat:imageUpload.uploaded'));
    } catch (error) {
      logger.chat.error('[kappa] chat image upload failed', error);
      toast.error(i18next.t('chat:imageUpload.failed'));
    } finally {
      setIsUploading(false);
    }
  }, [isUploading, onUploaded]);

  return { isUploading, pickAndUpload };
}
