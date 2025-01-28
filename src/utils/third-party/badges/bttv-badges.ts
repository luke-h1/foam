import { bttvBadgeService } from '@app/services/bttvBadgeService';
import type { BadgesLoader, BadgesParser, BttvBadgesResponse } from '../types';

let badgesList: BttvBadgesResponse = [];
const badgeCache: { badgesList: BttvBadgesResponse } = { badgesList: [] };

const load: BadgesLoader = async (_channelId, force = false) => {
  const hasLoaded = badgesList.length > 0;
  if (hasLoaded && !force) {
    return;
  }

  if (badgeCache.badgesList.length > 0 && !force) {
    badgesList = badgeCache.badgesList;
    return;
  }

  badgesList = await bttvBadgeService.getBadges();
  badgeCache.badgesList = badgesList;
};

export const bttvBadgesParser: BadgesParser = {
  provider: 'bttv',
  parse: async (_badges, username) => {
    await load(null);
    return badgesList
      .filter(x => x.name === username)
      .map(x => ({
        id: x.badge.type.toString(),
        title: x.badge.description,
        images: [x.badge.svg],
      }));
  },
  load,
};
