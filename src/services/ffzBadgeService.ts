import { FfzBadgesResponse } from '../utils/third-party/types';
import { ffzApi } from './api';

export const ffzBadgeService = {
  getBadges: async () => {
    try {
      return ffzApi.get<FfzBadgesResponse>('/badges');

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      return {
        badges: [],
        users: {},
      };
    }
  },
} as const;
