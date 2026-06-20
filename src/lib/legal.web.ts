import { router } from 'expo-router';

export function openLicenseList(_title: string): void {
  router.push('/tabs/settings/licenses');
}
