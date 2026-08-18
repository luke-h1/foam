import type { EmoteProvider, EmoteSite } from '@app/types/emote';

/**
 * The one mapping from the `site` display string to the `provider`
 * discriminant. Emote constructors stamp `provider` directly; this map exists
 * for the persisted-cache backfill, which hydrates emotes written by builds
 * that predate the field.
 */
export const EMOTE_PROVIDER_BY_SITE = {
  '7TV Channel': '7tv',
  '7TV Global': '7tv',
  '7TV Personal': '7tv',
  BTTV: 'bttv',
  'Global BTTV': 'bttv',
  FFZ: 'ffz',
  'Global FFZ': 'ffz',
  'Twitch Channel': 'twitch',
  'Twitch Global': 'twitch',
  'Twitch Subscriber': 'twitch',
  Emoji: 'emoji',
} satisfies Record<EmoteSite, EmoteProvider>;
