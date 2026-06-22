import { Linking } from 'react-native';

import * as WebBrowser from 'expo-web-browser';

import { theme } from '@app/styles/themes';

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
