import { BttvBadgesResponse } from '../utils/third-party/types';
import { bttvCachedApi } from './api';

const bttvBadgeService = {
  getBadges: async () => {
    try {
      const { data } =
        await bttvCachedApi.get<BttvBadgesResponse>('/badges/twitch');

      return data;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      return [];
    }
  },
} as const;

export default bttvBadgeService;
