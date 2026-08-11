import type { TwitchSanitisedEmote } from '@app/types/emote';
import type { PaginatedList } from '@app/types/twitch/api';
import type { TwitchEmote } from '@app/types/twitch/emote';

import { twitchApi } from './api/clients';
import { buildSanitisedEmote } from './emote-provider';
import { twitchService } from './twitch-service';

interface TwitchEmotePage {
  data?: TwitchEmote[];
  pagination?: {
    cursor?: string;
  };
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

function toTwitchImageUrl(
  emoteId: string,
  format: 'default' | 'static' = 'default',
  scale: '1.0' | '2.0' | '3.0' = '3.0',
): string {
  return `https://static-cdn.jtvnw.net/emoticons/v2/${emoteId}/${format}/dark/${scale}`;
}

function sanitiseTwitchEmote(
  emote: Pick<TwitchEmote, 'id' | 'name'> & { owner_id?: string },
  site: TwitchSanitisedEmote['site'],
  creator: string | null,
): TwitchSanitisedEmote | null {
  return buildSanitisedEmote({
    id: emote.id,
    name: emote.name,
    site,
    creator,
    emoteLink: toTwitchImageUrl(emote.id),
    originalName: emote.name,
    animated: {
      '2x': toTwitchImageUrl(emote.id, 'default', '2.0'),
      '4x': toTwitchImageUrl(emote.id, 'default', '3.0'),
    },
    static: {
      '2x': toTwitchImageUrl(emote.id, 'static', '2.0'),
      '4x': toTwitchImageUrl(emote.id, 'static', '3.0'),
    },
    ownerId: emote.owner_id,
  });
}

function sanitiseTwitchEmotes(
  emotes: (Pick<TwitchEmote, 'id' | 'name'> & { owner_id?: string })[],
  site: TwitchSanitisedEmote['site'],
  creator: string | null,
): TwitchSanitisedEmote[] {
  const sanitised: TwitchSanitisedEmote[] = [];
  for (const emote of emotes) {
    const result = sanitiseTwitchEmote(emote, site, creator);
    if (result) {
      sanitised.push(result);
    }
  }
  return sanitised;
}

export const twitchEmoteService = {
  getChannelEmotes: async (
    channelId: string,
  ): Promise<TwitchSanitisedEmote[]> => {
    const [result, broadcaster] = await Promise.all([
      twitchApi.get<PaginatedList<TwitchEmote & { template: string }>>(
        '/chat/emotes',
        {
          params: {
            broadcaster_id: channelId,
          },
        },
      ),
      twitchService.getUser(undefined, channelId),
    ]);

    return sanitiseTwitchEmotes(
      result.data,
      'Twitch Channel',
      broadcaster.display_name,
    );
  },

  getGlobalEmotes: async (): Promise<TwitchSanitisedEmote[]> => {
    const result = await twitchApi.get<{ data: TwitchGlobalEmote[] }>(
      '/chat/emotes/global',
    );

    return sanitiseTwitchEmotes(result.data, 'Twitch Global', null);
  },

  getSubscriberEmotes: async (
    userId: string,
    broadcasterId?: string,
  ): Promise<TwitchSanitisedEmote[]> => {
    const emotes: TwitchEmote[] = [];
    let cursor: string | undefined;

    do {
      // eslint-disable-next-line no-await-in-loop
      const result = await twitchApi.get<TwitchEmotePage>('/chat/emotes/user', {
        params: {
          user_id: userId,
          broadcaster_id: broadcasterId,
          after: cursor,
        },
      });

      emotes.push(...(result.data ?? []));
      cursor = result.pagination?.cursor;
    } while (cursor);

    return sanitiseTwitchEmotes(emotes, 'Twitch Subscriber', null);
  },
} as const;
