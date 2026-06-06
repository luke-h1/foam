import { theme } from '@app/styles/themes';
import * as WebBrowser from 'expo-web-browser';
import { Linking } from 'react-native';

export function openLinkInBrowser(url: string) {
  void WebBrowser.openBrowserAsync(url, {
    controlsColor: theme.colorPrimary,
    createTask: false,
    dismissButtonStyle: 'close',
    enableBarCollapsing: true,
    showTitle: true,
    toolbarColor: theme.color.background.dark,
  }).catch(() => {
    void Linking.openURL(url);
  });
}
