import { Alert, Linking, Platform } from 'react-native';

import * as MediaLibrary from 'expo-media-library';

import { presentMediaPermissionPrompt } from '@app/store/overlays/mediaPermissionStore';

export async function ensureMediaLibraryPermission(): Promise<boolean> {
  if (Platform.OS === 'web') {
    return true;
  }

  const { granted } = await MediaLibrary.requestPermissionsAsync();
  if (granted) {
    return true;
  }

  const title = 'Permission required';
  const message =
    'Allow Foam to save images and clips to your photo gallery in Settings.';
  const cancelLabel = 'Cancel';
  const settingsLabel = 'Open Settings';

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
