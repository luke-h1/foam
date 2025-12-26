import { Platform } from 'react-native';

export function isIOS26OrLater() {
  if (Platform.OS !== 'ios') {
    return false;
  }

  const version = parseInt(Platform.Version, 10);

  return version >= 26;
}
