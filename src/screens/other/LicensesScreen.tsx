import { Redirect } from 'expo-router';

/**
 * Native apps show the license list with `openLicenseList` from About. Only
 * the web build has a licenses page, so a deep link here goes to About.
 */
export function LicensesScreen() {
  return <Redirect href='/tabs/settings/about' />;
}
