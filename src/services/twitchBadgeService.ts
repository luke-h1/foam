import { OpenStringUnion } from '@app/utils';
import { twitchApi } from './api';

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

export interface SanitisedBadgeSet {
  id: string;
  url: string;
  type: OpenStringUnion<
    | 'Twitch Channel Badge'
    | 'Twitch Subscriber Badge'
    | 'Twitch Bit Badge'
    | 'Twitch Global Badge'
    | 'FFZ Badge'
    | 'FFZ Channel Badge'
  >;
  title: string;

  color?: string;
  owner_username?: string;
  /**
   * The set ID
   */
  set: string;
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
      if (badgeSet.set_id === 'bits') {
        badgeSet.versions.forEach((badge: TwitchBadgeVersion) => {
          sanitisedBadges.push({
            id: badge.id,
            url: badge.image_url_4x,
            type: 'Twitch Bit Badge',
            title: `Cheer ${badge.id}`,
            set: badgeSet.set_id,
          });
        });
      }
      if (badgeSet.set_id === 'subscriber') {
        badgeSet.versions.forEach((badge: TwitchBadgeVersion) => {
          sanitisedBadges.push({
            id: badge.id,
            url: badge.image_url_4x,
            type: 'Twitch Subscriber Badge',
            title: badge.title,
            set: badgeSet.set_id,
          });
        });
      }
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
            id: `${badgeSet.set_id}_${version.id}`, // set set_id as id
            url: version.image_url_4x,
            title: version.title,
            type: 'Twitch Global Badge',
            set: badgeSet.set_id,
          });
        });
      }
    });

    return sanitisedBadges;
  },
} as const;
