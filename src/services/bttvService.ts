import {
  BttvGlobalEmotesResponse,
  EmotesList,
} from '../utils/third-party/types';
import { bttvApi, bttvCachedApi } from './api';
import { SanitisiedEmoteSet } from './seventTvService';

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

export const bttvService = {
  getSanitisedGlobalEmotes: async (): Promise<SanitisiedEmoteSet[]> => {
    const result = await bttvCachedApi.get<BttvEmote[]>('/emotes/global');

    return result.map<SanitisiedEmoteSet>(emote => ({
      name: emote.code,
      url: `https://cdn.betterttv.net/emote/${emote.id}/3x`,
      emote_link: `https://betterttv.com/emotes/${emote.id}`,
      original_name: emote.codeOriginal ?? 'UNKNOWN',
      creator: null,
      site: 'Global BTTV',
      flags: bttvZeroWidthEmotes.includes(emote.code) ? 256 : undefined,
    }));
  },

  getSanitisedChannelEmotes: async (
    twitchChannelId: string,
  ): Promise<SanitisiedEmoteSet[]> => {
    const result = await bttvCachedApi.get<BttvChannelEmoteSet>(
      `/users/twitch/${twitchChannelId}`,
    );

    const sharedEmotes = result.sharedEmotes.map<SanitisiedEmoteSet>(emote => ({
      name: emote.code,
      url: `https://cdn.betterttv.net/emote/${emote.id}/3x`,
      emote_link: `https://betterttv.com/emotes/${emote.id}`,
      original_name: emote?.codeOriginal ?? 'UNKNOWN',
      creator: emote.user?.name || null,
      site: 'BTTV',
    }));

    const channelEmotes = result.channelEmotes.map<SanitisiedEmoteSet>(
      emote => ({
        name: emote.code,
        url: `https://cdn.betterttv.net/emote/${emote.id}/3x`,
        emote_link: `https://betterttv.com/emotes/${emote.id}`,
        original_name: emote?.codeOriginal ?? 'UNKNOWN',
        creator: emote.user?.name || null,
        site: 'BTTV',
      }),
    );

    return [...sharedEmotes, ...channelEmotes];
  },

  /**
   * @deprecated use getSanitisedGlobalEmotes instead
   *
   */
  getGlobalEmotes: async (): Promise<EmotesList> => {
    try {
      const result = await bttvApi.get<BttvGlobalEmotesResponse>(
        '/cached/emotes/global',
      );

      const sanitizedResult = result.map(c => ({
        id: c.id,
        code: c.code,
        channelId: null,
      }));

      return sanitizedResult;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      return [];
    }
  },
} as const;
