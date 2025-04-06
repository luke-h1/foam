import { OpenStringUnion } from '@app/utils';
import { ivrApi } from './api';

interface TwitchBadge {
  id: string;
  image_url_1x: string;
  image_url_2x: string;
  image_url_4x: string;
  /**
   * @example cheer 1
   */
  title: string;

  /**
   * @example cheer 1
   */
  description: string;
  click_action: OpenStringUnion<'visit_url' | 'subscribe_to_channel'> | null;
  click_url: string | null;
}

interface IvrChannelBadges {
  set_id: OpenStringUnion<'bits' | 'subscriber'>;
  versions: TwitchBadge[];
}

export const twitchBadgeService = {
  getBadges: async (broadcasterLogin: string) => {
    const result = await ivrApi.get<IvrChannelBadges[]>(
      '/twitch/badges/channel',
      {
        params: {
          login: broadcasterLogin,
        },
      },
    );

    return result;
  },
  getGlobalBadges: async () => {
    const result = await ivrApi.get<IvrChannelBadges[]>(
      '/twitch/badges/global',
    );

    return result;
  },
} as const;
