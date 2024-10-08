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
    try {
      const response =
        await twitchBadgeApi.get<BadgesResponse>('/global/display');
      return response.data;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_e) {
      return emptyResponse;
    }
  },
  fetchChannelBadges: async (id: string) => {
    try {
      const response = await twitchBadgeApi.get<BadgesResponse>(
        `/channels/${id}/display`,
      );
      return response.data;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_e) {
      return emptyResponse;
    }
  },
};

export default twitchBadgeService;
