import { BttvBadgesResponse } from '../utils/third-party/types';
import { bttvCachedApi } from './api';

export const bttvBadgeService = {
  getBadges: async () => {
    try {
      const result =
        await bttvCachedApi.get<BttvBadgesResponse>('/badges/twitch');

      return result;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      return [];
    }
  },
} as const;
