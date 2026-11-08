import { Alert } from 'react-native';

import { router } from 'expo-router';
import { toast } from 'sonner-native';

import { openLinkInBrowser } from '@app/utils/browser/openLinkInBrowser';
import { logger } from '@app/utils/logger';

/**
 * Foam has no backend accounts (sign-in is Twitch OAuth), so deletion goes through Twitch's Security & Privacy page with "Disable or Delete My Account".
 */
const TWITCH_ACCOUNT_SETTINGS_URL = 'https://www.twitch.tv/settings/security';

export function formatMemberSince(createdAt?: string) {
  if (!createdAt) {
    return 'Unknown';
  }

  const date = new Date(createdAt);

  if (Number.isNaN(date.getTime())) {
    return 'Unknown';
  }

  return date.toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });
}

export function confirmDeleteAccount() {
  Alert.alert(
    'Delete Account',
    "Foam has no accounts of its own. You sign in with Twitch. To delete your account for good, continue to Twitch's account settings. To only remove your login from this device, use Log out above.",
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Continue to Twitch',
        style: 'destructive',
        onPress: () => openLinkInBrowser(TWITCH_ACCOUNT_SETTINGS_URL),
      },
    ],
  );
}

export async function signOut(logout: () => Promise<void>): Promise<void> {
  try {
    await logout();
    router.replace('/tabs/top');
  } catch (error) {
    logger.main.warn('Sign out failed', error);
    toast.error('Could not sign out. Try again.');
  }
}

export function confirmLogout(logout: () => Promise<void>) {
  Alert.alert('Sign Out', 'Sign out of your account?', [
    { text: 'Cancel', style: 'cancel' },
    {
      text: 'Sign Out',
      style: 'destructive',
      onPress: () => {
        void signOut(logout);
      },
    },
  ]);
}
