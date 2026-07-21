import { Linking } from 'react-native';

import * as WebBrowser from 'expo-web-browser';

import { type ColorScheme, theme } from '@app/styles/themes';

export function openLinkInBrowser(url: string, scheme: ColorScheme) {
  void WebBrowser.openBrowserAsync(url, {
    controlsColor: theme.color.accent[scheme],
    createTask: false,
    dismissButtonStyle: 'close',
    enableBarCollapsing: true,
    showTitle: true,
    toolbarColor: theme.color.background[scheme],
  }).catch(() => {
    void Linking.openURL(url);
  });
}
