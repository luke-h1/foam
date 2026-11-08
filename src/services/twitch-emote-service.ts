import type { TwitchSanitisedEmote } from '@app/types/emote';
import type { PaginatedList } from '@app/types/twitch/api';
import type { TwitchEmote } from '@app/types/twitch/emote';
import { twitchEmoteCdn } from '@app/utils/emote/cdn/twitch';
import { buildSanitisedEmote } from '@app/utils/emote/sanitised/buildSanitisedEmote';
import { sanitiseAll } from '@app/utils/emote/sanitised/sanitiseAll';

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

interface SanitisableTwitchEmote extends Pick<TwitchEmote, 'id' | 'name'> {
  owner_id?: string;
}

function sanitiseTwitchEmote(
  emote: SanitisableTwitchEmote,
  site: TwitchSanitisedEmote['site'],
  creator: string | null,
): TwitchSanitisedEmote | null {
  const variants = twitchEmoteCdn.buildVariants({
    id: emote.id,
    animated: null,
  });

  return buildSanitisedEmote({
    id: emote.id,
    name: emote.name,
    site,
    creator,
    emoteLink: twitchEmoteCdn.pageUrl(emote.id),
    originalName: emote.name,
    animated: variants.animated ?? {},
    static: variants.static ?? {},
    ownerId: emote.owner_id,
  });
}

function sanitiseTwitchEmotes(
  emotes: SanitisableTwitchEmote[],
  site: TwitchSanitisedEmote['site'],
  creator: string | null,
): TwitchSanitisedEmote[] {
  return sanitiseAll(emotes, emote =>
    sanitiseTwitchEmote(emote, site, creator),
  );
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
