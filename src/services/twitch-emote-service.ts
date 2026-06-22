import type { TwitchSanitisedEmote } from '@app/types/emote';
import type { PaginatedList } from '@app/types/twitch/api';
import type { TwitchEmote } from '@app/types/twitch/emote';
import { createEmoteImageVariants } from '@app/utils/emote/emoteImageVariants';

import { twitchApi } from './api/clients';
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
  emote: Pick<TwitchEmote, 'id' | 'name'>,
  site: TwitchSanitisedEmote['site'],
  creator: string | null,
): TwitchSanitisedEmote {
  const imageVariants = createEmoteImageVariants({
    animated: {
      '2x': toTwitchImageUrl(emote.id, 'default', '2.0'),
      '4x': toTwitchImageUrl(emote.id, 'default', '3.0'),
    },
    static: {
      '2x': toTwitchImageUrl(emote.id, 'static', '2.0'),
      '4x': toTwitchImageUrl(emote.id, 'static', '3.0'),
    },
  });

  return {
    name: emote.name,
    id: emote.id,
    url: toTwitchImageUrl(emote.id),
    static_url: toTwitchImageUrl(emote.id, 'static'),
    image_variants: imageVariants,
    emote_link: toTwitchImageUrl(emote.id),
    creator,
    original_name: emote.name,
    site,
  };
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

    const sanitisedSet = result.data.map<TwitchSanitisedEmote>(emote =>
      sanitiseTwitchEmote(emote, 'Twitch Channel', broadcaster.display_name),
    );

    return sanitisedSet;
  },

  getGlobalEmotes: async (): Promise<TwitchSanitisedEmote[]> => {
    const result = await twitchApi.get<{ data: TwitchGlobalEmote[] }>(
      '/chat/emotes/global',
    );

    const sanitisedSet = result.data.map<TwitchSanitisedEmote>(emote =>
      sanitiseTwitchEmote(emote, 'Twitch Global', null),
    );

    return sanitisedSet;
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

    return emotes.map<TwitchSanitisedEmote>(emote =>
      sanitiseTwitchEmote(emote, 'Twitch Subscriber', null),
    );
  },
} as const;
