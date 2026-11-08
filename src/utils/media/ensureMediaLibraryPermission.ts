import { Alert, Linking } from 'react-native';

import * as MediaLibrary from 'expo-media-library';

import { MEDIA_PERMISSION_PROMPT } from '@app/utils/media/constants';

export async function ensureMediaLibraryPermission(): Promise<boolean> {
  const { granted } = await MediaLibrary.requestPermissionsAsync();

  if (granted) {
    return true;
  }

  const { title, message, cancelLabel, settingsLabel } =
    MEDIA_PERMISSION_PROMPT;

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
