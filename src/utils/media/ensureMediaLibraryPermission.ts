import { Alert, Linking, Platform } from 'react-native';

import * as MediaLibrary from 'expo-media-library';

import i18next from '@app/i18n/i18next';
import { presentMediaPermissionPrompt } from '@app/store/overlays/mediaPermissionStore';

export async function ensureMediaLibraryPermission(): Promise<boolean> {
  if (Platform.OS === 'web') {
    return true;
  }

  const { granted } = await MediaLibrary.requestPermissionsAsync();
  if (granted) {
    return true;
  }

  const title = i18next.t('common:permissionRequired');
  const message = i18next.t('common:mediaLibraryPermissionMessage');
  const cancelLabel = i18next.t('common:cancel');
  const settingsLabel = i18next.t('common:openSettings');

  if (Platform.OS === 'android') {
    await presentMediaPermissionPrompt({
      title,
      message,
      cancelLabel,
      settingsLabel,
    });
    return false;
  }

  return new Promise(resolve => {
    Alert.alert(
      title,
      message,
      [
        {
          text: cancelLabel,
          style: 'cancel',
          onPress: () => resolve(false),
        },
        {
          text: settingsLabel,
          onPress: () => {
            void Linking.openSettings();
            resolve(false);
          },
        },
      ],
      { cancelable: true, onDismiss: () => resolve(false) },
    );
  });
}
