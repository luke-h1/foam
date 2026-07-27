import type { SFSymbol } from 'sf-symbols-typescript';

import type { AndroidSymbol } from '@app/components/ui/Icon/Icon';
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

export const DENSITY_OPTIONS = [
  { labelKey: 'densityComfortable', value: 'comfortable' },
  { labelKey: 'densityCompact', value: 'compact' },
] as const;

export const FONT_SCALE_OPTIONS = [
  { labelKey: 'fontSmall', value: 'small' },
  { labelKey: 'fontDefault', value: 'default' },
  { labelKey: 'fontLarge', value: 'large' },
] as const;

export const TIMESTAMP_FORMAT_OPTIONS = [
  { labelKey: 'timestamp24h', value: '24h' },
  { labelKey: 'timestamp12h', value: '12h' },
] as const;

export const DELETED_STYLE_OPTIONS = [
  { labelKey: 'deletedShowNotice', value: 'notice' },
  { labelKey: 'deletedHide', value: 'hidden' },
] as const;

export const SCROLLBACK_OPTIONS = [
  { label: '150', value: 150 as const },
  { label: '200', value: 200 as const },
  { label: '250', value: 250 as const },
] as const;

export const SCROLLBACK_LABELS = SCROLLBACK_OPTIONS.map(option => option.label);

// Chat-delay presets (auto-sync, off, manual seconds), shared by the iOS Picker and Android segmented control.
export const CHAT_DELAY_OPTIONS = [
  { labelKey: 'chatDelayAuto', value: 'auto' as const },
  { labelKey: 'chatDelayOff', value: 'off' as const },
  { labelKey: 'chatDelay2s', value: 2 as const },
  { labelKey: 'chatDelay5s', value: 5 as const },
  { labelKey: 'chatDelay8s', value: 8 as const },
  { labelKey: 'chatDelay12s', value: 12 as const },
  { labelKey: 'chatDelay15s', value: 15 as const },
] as const;

export const EMOJI_PREVIEW_SHORTCODES = [':joy:', ':heart:', ':fire:'];

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
    labelKey: 'showTimestamps',
    subtitleKey: 'showTimestampsDescription',
    icon: {
      icon: 'clock',
      androidIcon: 'schedule',
      color: theme.colorGrey,
    },
  },
  {
    key: 'highlightOwnMentions',
    labelKey: 'highlightOwnMentions',
    subtitleKey: 'highlightOwnMentionsDescription',
    icon: {
      icon: 'at',
      androidIcon: 'alternate_email',
      color: theme.colorGrey,
    },
  },
  {
    key: 'showInlineReplyContext',
    labelKey: 'inlineReplyContext',
    subtitleKey: 'inlineReplyContextDescription',
    icon: {
      icon: 'arrowshape.turn.up.left',
      androidIcon: 'reply',
      color: theme.colorGrey,
    },
  },
  {
    key: 'showUnreadJumpPill',
    labelKey: 'showJumpPill',
    subtitleKey: 'showJumpPillDescription',
    icon: {
      icon: 'arrow.down.circle',
      androidIcon: 'arrow_circle_down',
      color: theme.colorGrey,
    },
  },
] as const satisfies readonly {
  icon: { color: string; icon: SFSymbol; androidIcon: AndroidSymbol };
  key: ContextPreviewKey;
  labelKey: string;
  subtitleKey: string;
}[];
