import { ivrApi, twitchApi } from './api';
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
   * @todo -  move to our own API or do logic in app
   */
  getIvrChannelEmotes: async (channelId: string) => {
    const result = await ivrApi.get('/twitch/emotes/channel', {
      params: {
        channel: channelId,
      },
    });
  },
} as const;
