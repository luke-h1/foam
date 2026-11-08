import type { BttvBadge } from '@app/types/bttv/badge';
import type { BttvEmote } from '@app/types/bttv/emote';
import type { BttvSanitisedEmote } from '@app/types/emote';
import type { SanitisedBadgeSet } from '@app/types/twitch/badge';
import { bttvEmoteCdn } from '@app/utils/emote/cdn/bttv';
import { buildSanitisedBadge } from '@app/utils/emote/sanitised/buildSanitisedBadge';
import { buildSanitisedEmote } from '@app/utils/emote/sanitised/buildSanitisedEmote';
import { sanitiseAll } from '@app/utils/emote/sanitised/sanitiseAll';

import { bttvCachedApi } from './api/clients';

interface BttvChannelEmoteSet {
  id: string;
  bots: string[];

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

function sanitiseBttvEmote(
  emote: BttvEmote,
  site: BttvSanitisedEmote['site'],
  creator: string | null,
): BttvSanitisedEmote | null {
  const variants = bttvEmoteCdn.buildVariants({
    id: emote.id,
    animated: emote.animated,
  });

  return buildSanitisedEmote({
    id: emote.id,
    name: emote.code,
    site,
    creator,
    emoteLink: bttvEmoteCdn.pageUrl(emote.id),
    originalName: emote.codeOriginal,
    animated: variants.animated ?? {},
    static: variants.static ?? {},
    zeroWidth: bttvZeroWidthEmotes.includes(emote.code),
  });
}

function sanitiseBttvEmotes(
  emotes: BttvEmote[],
  site: BttvSanitisedEmote['site'],
  creatorOf: (emote: BttvEmote) => string | null,
): BttvSanitisedEmote[] {
  return sanitiseAll(emotes, emote =>
    sanitiseBttvEmote(emote, site, creatorOf(emote)),
  );
}

export const bttvEmoteService = {
  getSanitisedGlobalEmotes: async (): Promise<BttvSanitisedEmote[]> => {
    const result = await bttvCachedApi.get<BttvEmote[]>('/emotes/global');

    return sanitiseBttvEmotes(result, 'Global BTTV', () => null);
  },

  getSanitisedChannelEmotes: async (
    twitchChannelId: string,
  ): Promise<BttvSanitisedEmote[]> => {
    const result = await bttvCachedApi.get<BttvChannelEmoteSet>(
      `/users/twitch/${twitchChannelId}`,
    );

    const creatorOf = (emote: BttvEmote) => emote.user?.name || null;

    return [
      ...sanitiseBttvEmotes(result.sharedEmotes, 'BTTV', creatorOf),
      ...sanitiseBttvEmotes(result.channelEmotes, 'BTTV', creatorOf),
    ];
  },

  /**
   * BTTV serves one global list of user badges, each keyed to its owner's
   * Twitch user id; the finder matches a chatter's user id against the badge id.
   */
  getSanitisedGlobalBadges: async (): Promise<SanitisedBadgeSet[]> => {
    const result = await bttvCachedApi.get<BttvBadge[]>('/badges');

    return result.reduce<SanitisedBadgeSet[]>((badges, entry) => {
      if (entry.providerId && entry.badge?.svg) {
        badges.push(
          buildSanitisedBadge({
            id: entry.providerId,
            set: 'bttv',
            type: 'BTTV Badge',
            title: entry.badge.description || entry.displayName || entry.name,
            url: entry.badge.svg,
            provider: 'bttv',
          }),
        );
      }

      return badges;
    }, []);
  },
} as const;
