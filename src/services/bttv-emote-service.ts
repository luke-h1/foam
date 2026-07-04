import type { BttvEmote } from '@app/types/bttv/emote';
import type {
  BttvSanitisedEmote,
  EmoteImageVariantSet,
} from '@app/types/emote';

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

const bttvZeroWidthEmotes = ['cvHazmat', 'cvMask'];

function toBttvEmoteUrl(emoteId: string, scale: '2x' | '3x'): string {
  return `https://cdn.betterttv.net/emote/${emoteId}/${scale}`;
}

function toBttvStaticEmoteUrl(emoteId: string, scale: '2x' | '3x'): string {
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
    '2x': toBttvEmoteUrl(emote.id, '2x'),
    '3x': toBttvEmoteUrl(emote.id, '3x'),
  } satisfies EmoteImageVariantSet;
  const staticVariants: EmoteImageVariantSet = emote.animated
    ? {
        '2x': toBttvStaticEmoteUrl(emote.id, '2x'),
        '3x': toBttvStaticEmoteUrl(emote.id, '3x'),
      }
    : animatedVariants;

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
    flags: bttvZeroWidthEmotes.includes(emote.code) ? 256 : undefined,
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
} as const;
