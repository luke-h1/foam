import { Platform } from 'react-native';

import { type Href, router } from 'expo-router';
import type { SFSymbol } from 'sf-symbols-typescript';

import type { Preferences } from '@app/store/preference-store';
import { openLinkInBrowser } from '@app/utils/browser/openLinkInBrowser';
import { isDevToolsEnabled } from '@app/utils/dev-tools/isDevToolsEnabled';

export interface SettingsMenuRow {
  label: string;
  icon: SFSymbol;
  onPress: () => void;

  /**
   * True when the row pushes another settings screen. iOS shows a chevron
   * only on these rows.
   */
  pushes: boolean;

  /**
   * Shown under the label on Android. The iOS form shows the label only.
   */
  subtitle?: string;
}

function pushRow(
  label: string,
  icon: SFSymbol,
  href: Href,
  subtitle?: string,
): SettingsMenuRow {
  const row: SettingsMenuRow = {
    label,
    icon,
    onPress: () => router.push(href),
    pushes: true,
  };

  if (subtitle !== undefined) {
    row.subtitle = subtitle;
  }

  return row;
}

/**
 * Rows for the settings index. The iOS form and the Android list both
 * render them, so the two menus show the same items.
 */
const CHAT_MENU_ROWS: SettingsMenuRow[] = [
  pushRow(
    'Chat',
    'bubble.left.and.bubble.right',
    '/tabs/settings/chat-preferences',
  ),
  pushRow('Blocked terms', 'text.badge.xmark', '/tabs/settings/blocked-terms'),
  pushRow('Saved phrases', 'text.bubble', '/tabs/settings/saved-phrases'),
  pushRow(
    'Emotes and badges',
    'face.smiling',
    '/tabs/settings/emotes-and-badges',
  ),
];

const APP_MENU_ROWS: SettingsMenuRow[] = [
  pushRow('Haptics', 'hand.tap', '/tabs/settings/appearance'),
  pushRow('Storage', 'externaldrive', '/tabs/settings/cache'),
  pushRow('Privacy', 'hand.raised', '/tabs/settings/other'),
];

const HELP_MENU_ROWS: SettingsMenuRow[] = [
  pushRow('About Foam', 'info.circle', '/tabs/settings/about'),
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

export const PROFILE_ROW: SettingsMenuRow = pushRow(
  'Profile',
  'person.crop.circle',
  '/tabs/settings/profile',
  'Profile and Twitch account',
);

export const SIGNED_IN_MENU_ROWS: SettingsMenuRow[] = [
  pushRow('My clips', 'scissors', '/tabs/settings/my-clips'),
];

export const SIGN_IN_ROW: SettingsMenuRow = {
  label: 'Sign in with Twitch',
  icon: 'person.crop.circle',
  onPress: () => router.push('/auth-sheet'),
  pushes: false,
};

export const SIGN_IN_FOOTER =
  'See the channels you follow and chat as yourself.';

const DEVELOPER_MENU_ROWS: SettingsMenuRow[] = [
  pushRow('Dev tools', 'hammer', '/tabs/settings/dev-tools'),
];

interface GetUpdateMenuRowsOptions {
  canSeeUpdateAppButton: boolean;
  bundleButtonEnabled: boolean;
  openStore: () => void;
  updateBundle: () => void;
}

/**
 * The remote `bundleButtonEnabled` flag only gates iOS. Android always shows
 * the update bundle row.
 */
export function getUpdateMenuRows({
  canSeeUpdateAppButton,
  bundleButtonEnabled,
  openStore,
  updateBundle,
}: GetUpdateMenuRowsOptions): SettingsMenuRow[] {
  const showsBundleRow = Platform.OS !== 'ios' || bundleButtonEnabled;

  return [
    ...(canSeeUpdateAppButton
      ? [
          {
            label: 'Update app',
            icon: 'arrow.down.app',
            onPress: openStore,
            pushes: false,
          } satisfies SettingsMenuRow,
        ]
      : []),
    ...(showsBundleRow
      ? [
          {
            label: 'Update bundle',
            icon: 'arrow.triangle.2.circlepath',
            onPress: updateBundle,
            pushes: false,
          } satisfies SettingsMenuRow,
        ]
      : []),
  ];
}

export interface SettingsMenuSection {
  title: string;
  rows: SettingsMenuRow[];
}

interface GetSettingsMenuSectionsOptions {
  updateRows: SettingsMenuRow[];
  shouldShowDevTools: boolean;
}

/**
 * The sections of the settings index under the account section. The iOS form
 * and the Android list both render this table.
 */
export function getSettingsMenuSections({
  updateRows,
  shouldShowDevTools,
}: GetSettingsMenuSectionsOptions): SettingsMenuSection[] {
  return [
    { title: 'Chat', rows: CHAT_MENU_ROWS },
    { title: 'App', rows: APP_MENU_ROWS },
    ...(updateRows.length > 0 ? [{ title: 'Updates', rows: updateRows }] : []),
    { title: 'Help', rows: HELP_MENU_ROWS },
    ...(shouldShowDevTools
      ? [{ title: 'Developer', rows: DEVELOPER_MENU_ROWS }]
      : []),
  ];
}

export const DEVTOOLS_DIAGNOSTICS_ROUTES: SettingsMenuRow[] = [
  pushRow(
    'App Diagnostics',
    'stethoscope',
    '/tabs/settings/diagnostics',
    'Version, environment, and runtime details',
  ),
  pushRow(
    'Remote Config',
    'cloud',
    '/tabs/settings/remote-config',
    'Inspect fetched config and local overrides',
  ),
];

export const DEVTOOLS_ROUTES: SettingsMenuRow[] = [
  pushRow(
    'Debug',
    'ladybug',
    '/tabs/settings/debug',
    'Manual debug helpers and experiments',
  ),
  pushRow(
    'Cached Images',
    'photo.stack',
    '/tabs/settings/cached-images',
    'Inspect and manage emote and badge media cache',
  ),
  pushRow(
    'Changelog Demo',
    'list.bullet.rectangle',
    '/dev-tools/changelog',
    'Present sample native changelog payloads',
  ),
  pushRow(
    'Sentry Test',
    'exclamationmark.triangle',
    '/dev-tools/sentry-demo',
    'Throw an error to verify Sentry capture',
  ),
  pushRow(
    'Image Benchmark',
    'speedometer',
    '/dev-tools/image-benchmark',
    'expo-image vs nitro decode + synthetic chat stress test',
  ),
  pushRow(
    'Chat Perf (burst test)',
    'bolt.horizontal',
    '/dev-tools/chat-perf',
    'real cinna chat + synthetic burst flood + live FPS readout',
  ),
  pushRow(
    'Environment Variables',
    'doc.text',
    '/dev-tools/env-vars',
    'Inspect the EXPO_PUBLIC_ vars baked into this build',
  ),
  pushRow(
    'Synced Emotes',
    'metronome',
    '/dev-tools/synced-emotes',
    'staggered mounts of the same emote, frame-locked or not',
  ),
  pushRow(
    'Channel Surfing',
    'antenna.radiowaves.left.and.right',
    '/tabs/settings/channel-surfing',
    'Load an EAS Update from a different channel or PR branch',
  ),
  ...(isDevToolsEnabled
    ? [
        pushRow(
          'Storybook',
          'book.closed',
          '/tabs/settings/storybook',
          'Component previews and design-system inspection',
        ),
      ]
    : []),
];

export type DevtoolsToggleKey = keyof Pick<
  Preferences,
  | 'disableStream'
  | 'disableChat'
  | 'sharedChatEnabled'
  | 'enhancedVideoStability'
  | 'chatDebugTools'
>;

interface DevtoolsToggle {
  key: DevtoolsToggleKey;
  label: string;
  subtitle: string;
  icon: SFSymbol;
}

interface DevtoolsToggleSection {
  title: string;
  toggles: DevtoolsToggle[];
}

export const DEVTOOLS_TOGGLE_SECTIONS: DevtoolsToggleSection[] = [
  {
    title: 'Stream Diagnostics',
    toggles: [
      {
        key: 'disableStream',
        label: 'Disable Stream',
        subtitle: 'Remove the Twitch WebView to isolate chat performance',
        icon: 'video.slash',
      },
      {
        key: 'disableChat',
        label: 'Disable Chat',
        subtitle: 'Remove chat rendering to isolate the player',
        icon: 'message',
      },
    ],
  },
  {
    title: 'Feature Flags',
    toggles: [
      {
        key: 'sharedChatEnabled',
        label: 'Shared Chat',
        subtitle: 'Label messages relayed from another channel',
        icon: 'bubble.left.and.bubble.right',
      },
      {
        key: 'enhancedVideoStability',
        label: 'Enhanced Video Stability',
        subtitle: 'Refresh the player on stalls, errors and high latency',
        icon: 'wand.and.stars',
      },
      ...(isDevToolsEnabled
        ? [
            {
              key: 'chatDebugTools',
              label: 'Chat Debug Tools',
              subtitle: 'Log raw IRC and show debug info in chat sheets',
              icon: 'ladybug',
            } satisfies DevtoolsToggle,
          ]
        : []),
    ],
  },
];
