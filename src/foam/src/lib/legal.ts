import { ReactNativeLegal } from 'react-native-legal';

export function openLicenseList(title: string): void {
  ReactNativeLegal.launchLicenseListScreen(title);
}
