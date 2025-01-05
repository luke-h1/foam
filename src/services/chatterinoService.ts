import chatterinoBadgesData from '@app/data/chatterinoBadgesData';
import { OmitStrict } from '@app/types/util';

export interface ChatterinoRawBadge {
  tooltip: string;
  image1: string;
  image2: string;
  image3: string;
  users: string[];
}

export type ChatterinoBadge = OmitStrict<ChatterinoRawBadge, 'users'>;

export interface ChatterinoBadgesResponse {
  badges: ChatterinoRawBadge[];
}

const chatterinoService = {
  // TODO: move this to a lambda which syncs with chatterino API every 24 hours. We have to do it this way due to cors restrictions
  listGlobalBadges: async (): Promise<ChatterinoBadgesResponse> => {
    return chatterinoBadgesData;
  },
} as const;

export default chatterinoService;
