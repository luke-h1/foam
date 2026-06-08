import { theme } from '@app/styles/themes';
import * as WebBrowser from 'expo-web-browser';
import { Linking } from 'react-native';

export async function openLinkInBrowser(url: string) {
  await WebBrowser.openBrowserAsync(url, {
    controlsColor: theme.colorPrimary,
    createTask: false,
    dismissButtonStyle: 'close',
    enableBarCollapsing: true,
    showTitle: true,
    toolbarColor: theme.color.background.dark,
  }).catch(() => {
    Linking.openURL(url);
  });
}
