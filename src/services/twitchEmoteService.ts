import type { HelixChatBadgeSet } from '@twurple/api';

import { TwitchBadgesResponse } from '../utils/third-party/types';
import { twurple } from '../utils/third-party/util/twurple';

const formatBadgesResponse = (badges: HelixChatBadgeSet[]) => {
  return badges.map(badge => ({
    id: badge.id,
    versions: badge.versions.map(version => ({
      id: version.id,
      title: version.title,
      description: version.description,
      clickAction: version.clickAction,
      clickUrl: version.clickUrl,
      image_url_1x: version.getImageUrl(1),
      image_url_2x: version.getImageUrl(2),
      image_url_4x: version.getImageUrl(4),
    })),
  }));
};

export const twitchEmoteService = {
  listChannelBadges: async (
    channelId: string | null,
  ): Promise<TwitchBadgesResponse> => {
    if (!channelId) {
      return [];
    }

    const badges = await twurple.chat.getChannelBadges(channelId); // TODO: move to lambda + proxy

    const body = formatBadgesResponse(badges);

    return body as TwitchBadgesResponse;
  },
  listGlobalEmotes: async (): Promise<TwitchBadgesResponse> => {
    const badges = await twurple.chat.getGlobalBadges(); // TODO: move to lambda + proxy

    const body = formatBadgesResponse(badges);
    return body as TwitchBadgesResponse;
  },
} as const;
