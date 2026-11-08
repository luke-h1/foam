import type { PreferenceOption } from '@app/constants/chat-preferences';
import {
  type ChatDelaySetting,
  type ChatFontScale,
  type ChatScrollbackLength,
  type DeletedMessageStyle,
  initialPreferences,
} from '@app/store/preference-store';
import type { ChatTimestampFormat } from '@app/types/chat/chatTimestampFormat';

import type {
  PreferenceRowCopy,
  ProviderPreferenceSection,
} from './util/chatPreferenceTypes';

export const FONT_SCALE_OPTIONS = [
  { label: 'Small', value: 'small' },
  { label: 'Default', value: 'default' },
  { label: 'Large', value: 'large' },
] as const satisfies readonly PreferenceOption<ChatFontScale>[];

export const TIMESTAMP_FORMAT_OPTIONS = [
  { label: '24-hour', value: '24h' },
  { label: '12-hour', value: '12h' },
] as const satisfies readonly PreferenceOption<ChatTimestampFormat>[];

export const DELETED_STYLE_OPTIONS = [
  { label: 'Show notice', value: 'notice' },
  { label: 'Hide', value: 'hidden' },
] as const satisfies readonly PreferenceOption<DeletedMessageStyle>[];

export const SCROLLBACK_OPTIONS = [
  { label: '150', value: 150 },
  { label: '200', value: 200 },
  { label: '250', value: 250 },
] as const satisfies readonly PreferenceOption<ChatScrollbackLength>[];

export const CHAT_DELAY_OPTIONS = [
  { label: 'Auto', value: 'auto' },
  { label: 'Off', value: 'off' },
  { label: '2s', value: 2 },
  { label: '5s', value: 5 },
  { label: '8s', value: 8 },
  { label: '12s', value: 12 },
  { label: '15s', value: 15 },
] as const satisfies readonly PreferenceOption<ChatDelaySetting>[];

export const EMOJI_PREVIEW_SHORTCODES = [':joy:', ':heart:', ':fire:'];

export const CHAT_PREFERENCE_SECTION_TITLES = {
  layout: 'Layout',
  emoji: 'Emoji Style',
  context: 'Context',
  sync: 'Sync',
  highlights: 'Highlights',
  moderation: 'Moderation',
  performance: 'Performance',
  media: 'Media',
} as const;

export const CHAT_PREFERENCE_FOOTERS = {
  sync: 'Delay chat to match the video. Auto uses the measured stream latency.',
  highlights:
    'Highlighted phrases tint matching messages. Mention feedback also buzzes on a match.',
  performance: `Longer scrollback keeps more messages in memory. The default of ${initialPreferences.chatScrollback} is easier on older devices.`,
  media:
    'When on, animated Twitch, BTTV, FFZ, and 7TV emotes show as still images.',
} as const;

export const CHAT_PREFERENCE_ROWS = {
  density: {
    title: 'Message Density',
    icon: 'list.bullet',
  },
  fontScale: {
    title: 'Font Size',
    subtitle: 'Scales message text, usernames, and mentions',
    icon: 'textformat.size',
  },
  alternatingRows: {
    title: 'Alternating Rows',
    subtitle: 'Stripe alternate chat lines',
    icon: 'line.3.horizontal',
  },
  animate: {
    title: 'New Message Animation',
    subtitle: 'Slide in new messages',
    icon: 'arrow.up.message',
  },
  emojiSet: {
    title: 'Emoji Set',
    subtitle: 'Changes emoji images in existing chat messages',
    icon: 'face.smiling',
  },
  recentMessages: {
    title: 'Historical Recent Messages',
    subtitle: 'Load past messages from third-party recent-messages.robotty.de',
    icon: 'clock.arrow.circlepath',
  },
  timestampFormat: {
    title: 'Timestamp Format',
    subtitle: 'Applies to new messages',
    icon: 'clock.badge',
  },
  chatDelay: {
    title: 'Chat Delay',
    subtitle: 'Hold new messages before showing them',
    icon: 'timer',
  },
  highlightedPhrases: {
    title: 'Highlighted Phrases',
    subtitle: 'Tint messages containing custom phrases',
    icon: 'highlighter',
  },
  mentionFeedback: {
    title: 'Mention Feedback',
    subtitle: 'Buzz on mentions and highlight matches',
    icon: 'hand.tap',
  },
  deletedMessages: {
    title: 'Deleted Messages',
    subtitle: 'How removed messages appear in chat',
    icon: 'trash.slash',
  },
  keepHistoryOnClear: {
    title: 'Keep History on Clear',
    subtitle: 'Keep scrollback when a moderator clears chat',
    icon: 'clock.arrow.circlepath',
  },
  scrollback: {
    title: 'Scrollback',
    subtitle: 'Messages kept in chat history',
    icon: 'text.line.last.and.arrowtriangle.forward',
  },
  disableEmoteAnimations: {
    title: 'Disable Emote Animations',
    subtitle: 'Show emotes as still images',
    icon: 'slash.circle',
  },
  showChatGifs: {
    title: 'Show Chat GIFs',
    subtitle: 'Loads third-party GIF media',
    icon: 'photo',
    androidIcon: 'gif_box',
  },
  providerEmotes: {
    title: 'Emotes',
    icon: 'face.smiling',
  },
  providerBadges: {
    title: 'Badges',
    icon: 'rosette',
  },
} as const satisfies Record<string, PreferenceRowCopy>;

export const PROVIDER_PREFERENCE_SECTIONS = [
  {
    title: '7TV',
    provider: '7tv',
    emotes: { key: 'show7TvEmotes', subtitle: 'Render 7TV emotes in chat' },
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
] as const satisfies readonly ProviderPreferenceSection[];
