import type { FfzSanitisedEmote } from '@app/types/emote';
import type { FfzBadgesResponse } from '@app/types/ffz/badge';
import type {
  FfzChannelEmotesResponse,
  FfzEmoticon,
  FfzGlobalEmotesResponse,
} from '@app/types/ffz/emote';
import type { SanitisedBadgeSet } from '@app/types/twitch/badge';
import { ffzEmoteCdn } from '@app/utils/emote/cdn/ffz';
import { buildSanitisedBadge } from '@app/utils/emote/sanitised/buildSanitisedBadge';
import { buildSanitisedEmote } from '@app/utils/emote/sanitised/buildSanitisedEmote';
import { sanitiseAll } from '@app/utils/emote/sanitised/sanitiseAll';

import { ApiError } from './api/client';
import { ffzApi, isFfzNoSuchRoom } from './api/clients';

/**
 * Channel badges and channel emotes both read `/room/id/{id}`. A channel load
 * asks for both, so a settled room payload is kept for this long and shared.
 */
const ROOM_SHARE_MS = 30_000;

const MAX_SHARED_ROOMS = 8;

interface SharedRoom {
  room: Promise<FfzChannelEmotesResponse | null>;
  requestedAt: number;
}

const sharedRooms = new Map<string, SharedRoom>();

async function requestRoom(
  channelId: string,
): Promise<FfzChannelEmotesResponse | null> {
  try {
    return await ffzApi.get<FfzChannelEmotesResponse>(`/room/id/${channelId}`);
  } catch (error) {
    if (
      error instanceof ApiError &&
      isFfzNoSuchRoom(error.status, error.message)
    ) {
      return null;
    }

    throw error;
  }
}

function fetchRoom(
  channelId: string,
): Promise<FfzChannelEmotesResponse | null> {
  const now = Date.now();
  const shared = sharedRooms.get(channelId);

  if (shared && now - shared.requestedAt < ROOM_SHARE_MS) {
    return shared.room;
  }

  if (sharedRooms.size >= MAX_SHARED_ROOMS) {
    sharedRooms.clear();
  }

  const room = requestRoom(channelId);
  sharedRooms.set(channelId, { room, requestedAt: now });

  room.catch(() => {
    if (sharedRooms.get(channelId)?.room === room) {
      sharedRooms.delete(channelId);
    }
  });

  return room;
}

function sanitiseFfzEmote(
  emote: FfzEmoticon,
  site: FfzSanitisedEmote['site'],
  creator: string | null,
): FfzSanitisedEmote | null {
  const variants = ffzEmoteCdn.buildVariants({
    id: emote.id.toString(),
    animated: emote.animated,
  });

  return buildSanitisedEmote({
    id: emote.id.toString(),
    name: emote.name,
    site,
    creator,
    emoteLink: ffzEmoteCdn.pageUrl(String(emote.id)),
    animated: variants.animated ?? {},
    static: variants.static ?? {},
    width: emote.width,
    height: emote.height,
  });
}

/**
 * FFZ ships each badge at several sizes, keyed by scale. Take the largest.
 */
function largestBadgeUrl(
  urlsByScale: Record<string, string> | undefined,
): string | undefined {
  const scales = Object.keys(urlsByScale ?? {});

  if (scales.length === 0) {
    return undefined;
  }

  return urlsByScale?.[Math.max(...scales.map(Number)).toString()];
}

function sanitiseRoomBadges(
  room: FfzChannelEmotesResponse['room'],
  channelId: string,
): SanitisedBadgeSet[] {
  const vipBadgeUrl = largestBadgeUrl(room.vip_badge);
  const modBadgeUrl = largestBadgeUrl(room.mod_urls);
  const sanitisedBadges: SanitisedBadgeSet[] = [];

  if (vipBadgeUrl) {
    sanitisedBadges.push(
      buildSanitisedBadge({
        id: 'vip_badge',
        url: vipBadgeUrl,
        title: 'VIP',
        color: '#ff0000',
        ownerUsername: channelId,
        set: 'vip',
        type: 'FFZ Channel Badge',
        provider: 'ffz',
      }),
    );
  }

  if (modBadgeUrl) {
    sanitisedBadges.push(
      buildSanitisedBadge({
        id: 'mod_badge',
        url: modBadgeUrl,
        title: 'Moderator',
        color: '#1ac9a2',
        ownerUsername: channelId,
        set: 'mod',
        type: 'FFZ Channel Badge',
        provider: 'ffz',
      }),
    );
  }

  for (const [badge, users] of Object.entries(room.user_badges ?? {})) {
    for (const user of users) {
      sanitisedBadges.push(
        buildSanitisedBadge({
          id: badge,
          url: '',
          title: badge,
          color: '#ffffff',
          ownerUsername: user,
          set: badge,
          type: 'FFZ User Badge',
          provider: 'ffz',
        }),
      );
    }
  }

  return sanitisedBadges;
}

export const ffzService = {
  getSanitisedGlobalEmotes: async (): Promise<FfzSanitisedEmote[]> => {
    const result = await ffzApi.get<FfzGlobalEmotesResponse>('/set/global');
    const defaultSet = result.sets[String(result.default_sets[0])];

    if (!defaultSet) {
      return [];
    }

    return sanitiseAll(defaultSet.emoticons, emote =>
      sanitiseFfzEmote(emote, 'Global FFZ', 'UNKNOWN'),
    );
  },

  getSanitisedChannelBadges: async (
    channelId: string,
  ): Promise<SanitisedBadgeSet[]> => {
    const result = await fetchRoom(channelId);

    return result ? sanitiseRoomBadges(result.room, channelId) : [];
  },

  getSanitisedChannelEmotes: async (
    channelId: string,
  ): Promise<FfzSanitisedEmote[]> => {
    const result = await fetchRoom(channelId);
    const emoticons = result?.sets[result.room.set]?.emoticons;

    if (!emoticons) {
      return [];
    }

    return sanitiseAll(emoticons, emote =>
      sanitiseFfzEmote(emote, 'FFZ', emote.owner.name ?? 'unknown'),
    );
  },

  getSanitisedGlobalBadges: async (): Promise<SanitisedBadgeSet[]> => {
    const result = await ffzApi.get<FfzBadgesResponse>('/badges');
    const sanitisedSet: SanitisedBadgeSet[] = [];
    const seen = new Set<string>();

    for (const badge of result.badges) {
      const badgeId = badge.title.replace(' ', '_').toLowerCase();

      for (const username of result.users[badge.id] ?? []) {
        const key = `${badgeId}|${username}`;

        if (seen.has(key)) {
          continue;
        }

        seen.add(key);

        sanitisedSet.push(
          buildSanitisedBadge({
            id: badgeId,
            url: badge.urls['4'],
            title: badge.title,
            color: badge.color,
            ownerUsername: username,
            set: badge.id.toString(),
            type: 'FFZ Global Badge',
            provider: 'ffz',
          }),
        );
      }
    }

    return sanitisedSet;
  },
} as const;
