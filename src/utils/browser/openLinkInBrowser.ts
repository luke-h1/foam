import { Linking } from 'react-native';

export function openLinkInBrowser(url: string) {
  void Linking.canOpenURL(url).then(canOpen =>
    canOpen ? Linking.openURL(url) : Linking.openURL(url),
  );
}
