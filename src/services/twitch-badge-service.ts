import type { SanitisedBadgeSet } from '@app/types/twitch/badge';
import { OpenStringUnion } from '@app/utils/typescript/OpenStringUnion';

import { twitchApi } from './api/clients';

interface TwitchBadgeVersion {
  id: string;
  image_url_1x: string;
  image_url_2x: string;
  image_url_4x: string;
  title: string;
  description: string;
  click_action: string;
  click_url: string | null;
}

interface TwitchBadge {
  set_id: OpenStringUnion<'subscriber' | 'bits'>;
  versions: TwitchBadgeVersion[];
}

/**
 * A channel's badge sets are not limited to `bits` and `subscriber`: Twitch
 * also serves per-channel campaign sets (`campaign-<channelId>-<uuid>-mw`,
 * `-sub`) that a large share of a busy channel's chatters wear.
 */
function channelBadgeType(
  setId: TwitchBadge['set_id'],
): SanitisedBadgeSet['type'] {
  if (setId === 'bits') {
    return 'Twitch Bit Badge';
  }
  if (setId === 'subscriber') {
    return 'Twitch Subscriber Badge';
  }
  return 'Twitch Channel Badge';
}

export const twitchBadgeService = {
  listSanitisedChannelBadges: async (
    channelId: string,
  ): Promise<SanitisedBadgeSet[]> => {
    const result = await twitchApi.get<{ data: TwitchBadge[] }>(
      '/chat/badges',
      {
        params: {
          broadcaster_id: channelId,
        },
      },
    );

    const sanitisedBadges: SanitisedBadgeSet[] = [];

    result.data.forEach(badgeSet => {
      badgeSet.versions.forEach((badge: TwitchBadgeVersion) => {
        sanitisedBadges.push({
          id: badge.id,
          url: badge.image_url_4x,
          type: channelBadgeType(badgeSet.set_id),
          title: badgeSet.set_id === 'bits' ? `Cheer ${badge.id}` : badge.title,
          set: badgeSet.set_id,
          provider: 'twitch',
        });
      });
    });
    return sanitisedBadges;
  },
  listSanitisedGlobalBadges: async (): Promise<SanitisedBadgeSet[]> => {
    const result = await twitchApi.get<{ data: TwitchBadge[] }>(
      '/chat/badges/global',
    );

    const sanitisedBadges: SanitisedBadgeSet[] = [];

    result.data.forEach(badgeSet => {
      if (Object.keys(badgeSet).length > 0) {
        badgeSet.versions.forEach(version => {
          sanitisedBadges.push({
            id: `${badgeSet.set_id}_${version.id}`,
            url: version.image_url_4x,
            title: version.title,
            type: 'Twitch Global Badge',
            set: badgeSet.set_id,
            provider: 'twitch',
          });
        });
      }
    });

    return sanitisedBadges;
  },
} as const;
