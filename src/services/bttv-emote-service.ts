import type { BttvBadge } from '@app/types/bttv/badge';
import type { BttvEmote } from '@app/types/bttv/emote';
import type {
  BttvSanitisedEmote,
  EmoteImageVariantSet,
} from '@app/types/emote';
import type { SanitisedBadgeSet } from '@app/types/twitch/badge';

import { bttvCachedApi } from './api/clients';
import { buildSanitisedEmote } from './emote-provider';

interface BttvChannelEmoteSet {
  id: string;
  bots: string[];

  /**
   * the user's twitch avatar
   */
  avatar: string;

  channelEmotes: BttvEmote[];

  /**
   * Usually this is an empty array for most users
   */
  sharedEmotes: BttvEmote[];
}

// BTTV zero-width emotes have no flag in the API; this is the hardcoded list
// the official 7TV extension overlays.
const bttvZeroWidthEmotes = [
  'SoSnowy',
  'IceCold',
  'SantaHat',
  'TopHat',
  'ReinDeer',
  'CandyCane',
  'cvMask',
  'cvHazmat',
];

function toBttvEmoteUrl(emoteId: string, scale: '1x' | '2x' | '3x'): string {
  return `https://cdn.betterttv.net/emote/${emoteId}/${scale}`;
}

function toBttvStaticEmoteUrl(
  emoteId: string,
  scale: '1x' | '2x' | '3x',
): string {
  return `https://cdn.betterttv.net/emote/${emoteId}/${scale}.png`;
}

function getBttvImageVariants(emote: BttvEmote): BttvSanitisedEmote {
  return sanitiseBttvEmote(emote, 'BTTV', emote.user?.name || null);
}

function sanitiseBttvEmote(
  emote: BttvEmote,
  site: BttvSanitisedEmote['site'],
  creator: string | null,
): BttvSanitisedEmote {
  const animatedVariants = {
    '1x': toBttvEmoteUrl(emote.id, '1x'),
    '2x': toBttvEmoteUrl(emote.id, '2x'),
    '3x': toBttvEmoteUrl(emote.id, '3x'),
  } satisfies EmoteImageVariantSet;
  const staticVariants: EmoteImageVariantSet = emote.animated
    ? {
        '1x': toBttvStaticEmoteUrl(emote.id, '1x'),
        '2x': toBttvStaticEmoteUrl(emote.id, '2x'),
        '3x': toBttvStaticEmoteUrl(emote.id, '3x'),
      }
    : animatedVariants;

  const zeroWidth = bttvZeroWidthEmotes.includes(emote.code);

  return {
    ...buildSanitisedEmote({
      id: emote.id,
      name: emote.code,
      site,
      creator,
      emoteLink: `https://betterttv.com/emotes/${emote.id}`,
      originalName: emote.codeOriginal,
      animated: animatedVariants,
      static: staticVariants,
    }),
    flags: zeroWidth ? 256 : undefined,
    zero_width: zeroWidth || undefined,
  };
}

export const bttvEmoteService = {
  getSanitisedGlobalEmotes: async (): Promise<BttvSanitisedEmote[]> => {
    const result = await bttvCachedApi.get<BttvEmote[]>('/emotes/global');

    const sanitisedSet = result.map<BttvSanitisedEmote>(emote =>
      sanitiseBttvEmote(emote, 'Global BTTV', null),
    );

    return sanitisedSet;
  },

  getSanitisedChannelEmotes: async (
    twitchChannelId: string,
  ): Promise<BttvSanitisedEmote[]> => {
    const result = await bttvCachedApi.get<BttvChannelEmoteSet>(
      `/users/twitch/${twitchChannelId}`,
    );

    const sharedEmotes =
      result.sharedEmotes.map<BttvSanitisedEmote>(getBttvImageVariants);

    const channelEmotes =
      result.channelEmotes.map<BttvSanitisedEmote>(getBttvImageVariants);

    return [...sharedEmotes, ...channelEmotes];
  },

  /**
   * BTTV serves one global list of user badges (developer/supporter/etc.),
   * each keyed to its owner's Twitch user id. The finder matches a chatter's
   * user id against the badge id.
   */
  getSanitisedGlobalBadges: async (): Promise<SanitisedBadgeSet[]> => {
    const result = await bttvCachedApi.get<BttvBadge[]>('/badges');

    return result.reduce<SanitisedBadgeSet[]>((badges, entry) => {
      if (entry.providerId && entry.badge?.svg) {
        badges.push({
          id: entry.providerId,
          set: 'bttv',
          type: 'BTTV Badge',
          title: entry.badge.description || entry.displayName || entry.name,
          url: entry.badge.svg,
          provider: 'bttv',
        });
      }
      return badges;
    }, []);
  },
} as const;
