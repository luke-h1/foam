import { bttvCachedApi } from './api';
import { SanitisiedEmoteSet } from './seventv-service';

interface BttvEmote {
  id: string;
  code: string;
  codeOriginal?: string;
  imageType: string;
  animated: boolean;
  userId: string;
  modifier: boolean;
  user?: {
    name: string;
  };
}

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

export const bttvEmoteService = {
  getSanitisedGlobalEmotes: async (): Promise<SanitisiedEmoteSet[]> => {
    const result = await bttvCachedApi.get<BttvEmote[]>('/emotes/global');

    const sanitisedSet = result.map<SanitisiedEmoteSet>(emote => ({
      name: emote.code,
      id: emote.id,
      url: `https://cdn.betterttv.net/emote/${emote.id}/3x`,
      emote_link: `https://betterttv.com/emotes/${emote.id}`,
      original_name: emote.codeOriginal ?? 'UNKNOWN',
      creator: null,
      site: 'Global BTTV',
      flags: bttvZeroWidthEmotes.includes(emote.code) ? 256 : undefined,
    }));

    return sanitisedSet;
  },

  getSanitisedChannelEmotes: async (
    twitchChannelId: string,
  ): Promise<SanitisiedEmoteSet[]> => {
    const result = await bttvCachedApi.get<BttvChannelEmoteSet>(
      `/users/twitch/${twitchChannelId}`,
    );

    const sharedEmotes = result.sharedEmotes.map<SanitisiedEmoteSet>(emote => ({
      name: emote.code,
      id: emote.id,
      url: `https://cdn.betterttv.net/emote/${emote.id}/3x`,
      emote_link: `https://betterttv.com/emotes/${emote.id}`,
      original_name: emote?.codeOriginal ?? 'UNKNOWN',
      creator: emote.user?.name || null,
      site: 'BTTV',
    }));

    const channelEmotes = result.channelEmotes.map<SanitisiedEmoteSet>(
      emote => ({
        name: emote.code,
        id: emote.id,
        url: `https://cdn.betterttv.net/emote/${emote.id}/3x`,
        emote_link: `https://betterttv.com/emotes/${emote.id}`,
        original_name: emote?.codeOriginal ?? 'UNKNOWN',
        creator: emote.user?.name || null,
        site: 'BTTV',
      }),
    );

    return [...sharedEmotes, ...channelEmotes];
  },
} as const;
