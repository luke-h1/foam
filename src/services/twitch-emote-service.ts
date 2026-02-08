import type { TwitchSanitisedEmote } from '@app/types/emote';
import { twitchApi } from './api';
import { PaginatedList, twitchService } from './twitch-service';

export interface TwitchEmote {
  id: `emotesv2_${string}`;
  name: string;
  emote_type: 'follower' | 'subscriptions';
  emote_set_id: string;
  owner_id: string;
  format: ['static' | 'animated'];
  scale: ['1.0', '2.0', '3.0'];
  theme_mode: ['light', 'dark'];
}

interface TwitchGlobalEmote {
  id: string;
  name: string;
  images: {
    url_1x: string;
    url_2x: string;
    url_4x: string;
  };
  format: ['static' | 'animated'];
  scale: ['1.0', '2.0', '3.0'];
  theme_mode: ['light', 'dark'];
}

export const twitchEmoteService = {
  getChannelEmotes: async (
    channelId: string,
  ): Promise<TwitchSanitisedEmote[]> => {
    const result = await twitchApi.get<
      PaginatedList<TwitchEmote & { template: string }>
    >('/chat/emotes', {
      params: {
        broadcaster_id: channelId,
      },
    });

    const broadcaster = await twitchService.getUser(undefined, channelId);

    const sanitisedSet = result.data.map<TwitchSanitisedEmote>(emote => ({
      name: emote.name,
      id: emote.id,
      url: `https://static-cdn.jtvnw.net/emoticons/v2/${emote.id}/default/dark/3.0`,
      emote_link: `https://static-cdn.jtvnw.net/emoticons/v2/${emote.id}/default/dark/3.0`,
      creator: broadcaster.display_name,
      original_name: emote.name,
      site: 'Twitch Channel',
    }));

    return sanitisedSet;
  },

  getGlobalEmotes: async (): Promise<TwitchSanitisedEmote[]> => {
    const result = await twitchApi.get<{ data: TwitchGlobalEmote[] }>(
      '/chat/emotes/global',
    );

    const sanitisedSet = result.data.map<TwitchSanitisedEmote>(emote => ({
      name: emote.name,
      id: emote.id,
      url: `https://static-cdn.jtvnw.net/emoticons/v2/${emote.id}/default/dark/3.0`,
      emote_link: `https://static-cdn.jtvnw.net/emoticons/v2/${emote.id}/default/dark/3.0`,
      creator: null,
      original_name: emote.name,
      site: 'Twitch Global',
    }));

    return sanitisedSet;
  },
} as const;
