import { ivrApi, twitchApi } from './api';
import { SanitisiedEmoteSet } from './seventTvService';
import { PaginatedList } from './twitchService';

interface TwitchEmote {
  // id: 'emotesv2_0d74b0c36a3e4fe0b1fc0326345594d1';
  id: `emotesv2_${string}`;
  name: string;
  emote_type: 'follower' | 'subscriptions';
  emote_set_id: string;
  owner_id: string;
  format: ['static' | 'animated'];
  scale: ['1.0', '2.0', '3.0'];
  theme_mode: ['light', 'dark'];
}

interface Emote {
  id: string;
  setID: string;
  code: string;
  type: 'SUBSCRIPTIONS' | 'FOLLOWER';
  assetType: 'ANIMATED' | 'STATIC';
  artist?: string | null; // Optional for local emotes
}

interface SubProduct {
  displayName: string;
  emoteSetID: string;

  /**
   * Tier 1 = 1000
   * Tier 2 = 2000
   * Tier 3 = 3000
   */
  tier: string;
  emotes: Emote[];
}

interface LocalEmote {
  id: string;
  emotes: Emote[];
}

interface IvrEmoteResponse {
  subProducts: SubProduct[];
  bitEmotes: unknown[];
  localEmotes: LocalEmote[];
}

export const twitchEmoteService = {
  getChannelEmotes: async (userId: string, cursor?: string) => {
    const result = await twitchApi.get<
      PaginatedList<TwitchEmote & { template: string }>
    >('/chat/emotes/user', {
      params: {
        user_id: userId,
        ...(cursor ? { after: cursor } : {}),
      },
    });

    return result;
  },

  /**
   * @todo - move to our own API or do logic in app
   */
  getIvrChannelEmotes: async (
    channelId: string,
  ): Promise<SanitisiedEmoteSet[]> => {
    const result = await ivrApi.get<IvrEmoteResponse>(
      '/twitch/emotes/channel',
      {
        params: {
          channel: channelId,
        },
      },
    );

    return result.subProducts.flatMap(
      sub =>
        sub.emotes.map<SanitisiedEmoteSet>(emote => ({
          name: emote.code,
          url: `https://static-cdn.jtvnw.net/emoticons/v2/${emote.id}/default/dark/3.0`,
          emote_link: `https://static-cdn.jtvnw.net/emoticons/v2/${emote.id}/default/dark/3.0`,
          site: 'Twitch Channel Emote',
          creator: null,
          original_name: emote.code,
        })),
      ...result.bitEmotes.map<SanitisiedEmoteSet>(emote => ({
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        name: emote.code,
        // @ts-expect-error - improve types
        url: `https://static-cdn.jtvnw.net/emoticons/v2/${emote.id}/default/dark/3.0`,
        // @ts-expect-error - improve types
        emote_link: `https://static-cdn.jtvnw.net/emoticons/v2/${emote.id}/default/dark/3.0`,
        site: 'Twitch Channel Emote',
        creator: null,
        // @ts-expect-error emote type improvements
        original_name: emote.code,
      })),
      ...result.localEmotes.flatMap(local =>
        local.emotes.map<SanitisiedEmoteSet>(emote => ({
          name: emote.code,
          url: `https://static-cdn.jtvnw.net/emoticons/v2/${emote.id}/default/dark/3.0`,
          emote_link: `https://static-cdn.jtvnw.net/emoticons/v2/${emote.id}/default/dark/3.0`,
          site: 'Twitch Channel Emote',
          creator: null,
          original_name: emote.code,
        })),
      ),
    );
  },
} as const;
