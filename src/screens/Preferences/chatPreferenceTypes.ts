import type { AndroidSymbol } from 'expo-symbols';
import type { SFSymbol } from 'sf-symbols-typescript';
import { theme } from '@app/styles/themes';

export type ContextPreviewValue = {
  chatTimestamps: boolean;
  highlightOwnMentions: boolean;
  showInlineReplyContext: boolean;
  showUnreadJumpPill: boolean;
};

export type ContextPreviewKey = keyof ContextPreviewValue;

export type ProviderPreviewValue = {
  show7TvEmotes: boolean;
  show7tvBadges: boolean;
  showBttvEmotes: boolean;
  showBttvBadges: boolean;
  showFFzEmotes: boolean;
  showFFzBadges: boolean;
  showTwitchEmotes: boolean;
  showTwitchBadges: boolean;
};

export type ProviderPreviewKey = keyof ProviderPreviewValue;

export type PreviewProvider = '7tv' | 'bttv' | 'ffz' | 'twitch';

export type ProviderPreviewVariant = 'badges' | 'emotes';

export type SegmentedControlChangeEvent = {
  nativeEvent: {
    selectedSegmentIndex: number;
  };
};

export const DENSITY_OPTIONS = [
  { label: 'Comfortable', value: 'comfortable' as const },
  { label: 'Compact', value: 'compact' as const },
] as const;

export const DENSITY_LABELS = DENSITY_OPTIONS.map(option => option.label);

export const EMOJI_PREVIEW_SHORTCODES = [':joy:', ':heart:', ':fire:'];

export const HISTORICAL_RECENT_MESSAGES_EXPLAINER =
  'Loads historical recent messages in chat through the third-party API service at recent-messages.robotty.de.';

export const CONTEXT_PREVIEW_KEYS = [
  'chatTimestamps',
  'highlightOwnMentions',
  'showInlineReplyContext',
  'showUnreadJumpPill',
] as const satisfies readonly ContextPreviewKey[];

export const PROVIDER_PREVIEW_KEYS = [
  'show7TvEmotes',
  'show7tvBadges',
  'showBttvEmotes',
  'showBttvBadges',
  'showFFzEmotes',
  'showFFzBadges',
  'showTwitchEmotes',
  'showTwitchBadges',
] as const satisfies readonly ProviderPreviewKey[];

export const CONTEXT_TOGGLE_ROWS = [
  {
    key: 'chatTimestamps',
    label: 'Show Timestamps',
    subtitle: 'Display message timestamps inline',
    icon: {
      icon: 'clock',
      androidIcon: 'schedule',
      color: theme.colorBlue,
    },
  },
  {
    key: 'highlightOwnMentions',
    label: 'Highlight Own Mentions',
    subtitle: 'Accent messages that mention your username',
    icon: {
      icon: 'at',
      androidIcon: 'alternate_email',
      color: theme.colorViolet,
    },
  },
  {
    key: 'showInlineReplyContext',
    label: 'Inline Reply Context',
    subtitle: 'Show the replied-to message above responses',
    icon: {
      icon: 'arrowshape.turn.up.left',
      androidIcon: 'reply',
      color: theme.colorPlum,
    },
  },
  {
    key: 'showUnreadJumpPill',
    label: 'Show Jump Pill',
    subtitle: 'Display the unread jump-to-latest affordance',
    icon: {
      icon: 'arrow.down.circle',
      androidIcon: 'arrow_circle_down',
      color: theme.colorAmber,
    },
  },
] as const satisfies readonly {
  icon: { color: string; icon: SFSymbol; androidIcon: AndroidSymbol };
  key: ContextPreviewKey;
  label: string;
  subtitle: string;
}[];

export const PROVIDER_PREFERENCE_SECTIONS = [
  {
    title: '7TV',
    provider: '7tv',
    emotes: {
      key: 'show7TvEmotes',
      subtitle: 'Render 7TV emotes in chat',
    },
    badges: {
      key: 'show7tvBadges',
      subtitle: 'Render 7TV badges next to usernames',
    },
  },
  {
    title: 'BTTV',
    provider: 'bttv',
    emotes: {
      key: 'showBttvEmotes',
      subtitle: 'Render BetterTTV emotes in chat',
    },
    badges: {
      key: 'showBttvBadges',
      subtitle: 'Render BetterTTV badges next to usernames',
    },
  },
  {
    title: 'FFZ',
    provider: 'ffz',
    emotes: {
      key: 'showFFzEmotes',
      subtitle: 'Render FrankerFaceZ emotes in chat',
    },
    badges: {
      key: 'showFFzBadges',
      subtitle: 'Render FrankerFaceZ badges next to usernames',
    },
  },
  {
    title: 'Twitch',
    provider: 'twitch',
    emotes: {
      key: 'showTwitchEmotes',
      subtitle: 'Render native Twitch emotes in chat',
    },
    badges: {
      key: 'showTwitchBadges',
      subtitle: 'Render native Twitch badges next to usernames',
    },
  },
] as const satisfies readonly {
  badges: { key: ProviderPreviewKey; subtitle: string };
  emotes: { key: ProviderPreviewKey; subtitle: string };
  provider: PreviewProvider;
  title: string;
}[];
