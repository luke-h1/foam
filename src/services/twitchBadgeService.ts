import logger from '@app/utils/logger';
import { twitchBadgeApi } from './Client';

export interface BadgeVersion {
  image_url_1x: string;
  image_url_2x: string;
  image_url_4x: string;
  description: string;
  title: string;
  click_action: string;
  click_url?: string;
  last_updated?: Date;
}

export interface Versions {
  [version: string]: BadgeVersion;
}

export interface BadgesResponse {
  badge_sets: {
    [code: string]: {
      versions: Versions;
    };
  };
}

export type BadgeVersions = Map<string, Versions>;
export type ChannelBadges = Map<string, BadgeVersions>;

export interface BadgeIds {
  [code: string]: string;
}

export interface ParseBadgesOptions {
  channelId: string;
}

const emptyResponse: BadgesResponse = {
  badge_sets: {},
};

const twitchBadgeService = {
  fetchGlobalBadges: async () => {
    const errorMessage = 'Failed to fetch global badges';

    try {
      const response =
        await twitchBadgeApi.get<BadgesResponse>('/global/display');
      return response.data;
    } catch (e) {
      logger.error(errorMessage, e);
      return emptyResponse;
    }
  },
  fetchChannelBadges: async (id: string) => {
    const errorMessage = 'Failed to fetch channel badges';
    try {
      const response = await twitchBadgeApi.get<BadgesResponse>(
        `/channels/${id}/display`,
      );
      return response.data;
    } catch (e) {
      logger.error(errorMessage, e);
      return emptyResponse;
    }
  },
};

export default twitchBadgeService;
