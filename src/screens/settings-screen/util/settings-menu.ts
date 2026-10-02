import { router } from 'expo-router';
import type { SFSymbol } from 'sf-symbols-typescript';

import { openLinkInBrowser } from '@app/utils/browser/open-link-in-browser';

export interface SettingsMenuRow {
  label: string;
  icon: SFSymbol;
  onPress: () => void;

  /**
   * True when the row pushes another settings screen. iOS shows a chevron
   * only on these rows.
   */
  pushes: boolean;
}

/**
 * Rows for the settings index. The iOS form and the Android list both
 * render them, so the two menus show the same items.
 */
export const CHAT_MENU_ROWS: SettingsMenuRow[] = [
  {
    label: 'Chat',
    icon: 'bubble.left.and.bubble.right',
    onPress: () => router.push('/tabs/settings/chat-preferences'),
    pushes: true,
  },
  {
    label: 'Blocked terms',
    icon: 'text.badge.xmark',
    onPress: () => router.push('/tabs/settings/blocked-terms'),
    pushes: true,
  },
  {
    label: 'Saved phrases',
    icon: 'text.bubble',
    onPress: () => router.push('/tabs/settings/saved-phrases'),
    pushes: true,
  },
  {
    label: 'Emotes and badges',
    icon: 'face.smiling',
    onPress: () => router.push('/tabs/settings/emotes-and-badges'),
    pushes: true,
  },
];

export const APP_MENU_ROWS: SettingsMenuRow[] = [
  {
    label: 'Haptics',
    icon: 'hand.tap',
    onPress: () => router.push('/tabs/settings/appearance'),
    pushes: true,
  },
  {
    label: 'Storage',
    icon: 'externaldrive',
    onPress: () => router.push('/tabs/settings/cache'),
    pushes: true,
  },
  {
    label: 'Privacy',
    icon: 'hand.raised',
    onPress: () => router.push('/tabs/settings/other'),
    pushes: true,
  },
];

export const HELP_MENU_ROWS: SettingsMenuRow[] = [
  {
    label: 'About Foam',
    icon: 'info.circle',
    onPress: () => router.push('/tabs/settings/about'),
    pushes: true,
  },
  {
    label: 'FAQ',
    icon: 'questionmark.circle',
    onPress: () => openLinkInBrowser('https://foam-app.com/faq'),
    pushes: false,
  },
  {
    label: 'Send feedback',
    icon: 'paperplane',
    onPress: () => router.push('/feedback'),
    pushes: false,
  },
];
