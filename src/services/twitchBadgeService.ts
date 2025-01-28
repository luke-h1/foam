import { HelixChatBadgeSet } from '@twurple/api';
import {
  TwitchBadgesList,
  TwitchBadgesResponse,
} from '../utils/third-party/types';
import { twurple } from '../utils/third-party/util/twurple';

const formatBadgesResponse = (badges: HelixChatBadgeSet[]) =>
  badges.map(badge => ({
    id: badge.id,
    versions: badge.versions.map(version => ({
      id: version.id,
      title: version.title,
      description: version.description,
      clickAction: version.clickAction || '',
      clickUrl: version.clickUrl || '',
      image_url_1x: version.getImageUrl(1),
      image_url_2x: version.getImageUrl(2),
      image_url_4x: version.getImageUrl(4),
    })),
  }));

interface FormattedBadgeList {
  id: string;
  versionId: string;
  channelId: string | null;
  title: string;
  description: string;
  clickAction: string;
  clickUrl: string;
  images: string[]; // 1x, 2x, 4x
}

const formatTwitchBadgesList = (
  data: TwitchBadgesResponse,
  channelId: string | null,
): FormattedBadgeList[] => {
  return data.flatMap(c =>
    c.versions.map(version => ({
      id: version.id,
      versionId: version.id,
      channelId,
      title: version.title,
      description: version.description,
      clickAction: version.clickAction || '',
      clickUrl: version.clickUrl || '',
      images: [
        version.image_url_1x,
        version.image_url_2x,
        version.image_url_4x,
      ],
    })),
  );
};

export const twitchBadgeService = {
  getChannelBadges: async (
    channelId: string | null,
  ): Promise<TwitchBadgesList> => {
    if (!channelId) {
      return [];
    }
    try {
      const badges = await twurple.chat.getChannelBadges(channelId);
      const body = formatBadgesResponse(badges);

      const formattedBody = formatTwitchBadgesList(body, channelId);

      return formattedBody;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {
      return [];
    }
  },
  getGlobalBadges: async (): Promise<TwitchBadgesList> => {
    try {
      const badges = await twurple.chat.getGlobalBadges();
      const result = formatBadgesResponse(badges);
      return formatTwitchBadgesList(result, null);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {
      return [];
    }
  },
} as const;
