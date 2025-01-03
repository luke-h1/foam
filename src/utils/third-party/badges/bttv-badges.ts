import bttvBadgeService from '@app/services/bttvBadgeService';
import type { BadgesLoader, BadgesParser, BttvBadgesResponse } from '../types';

let badgesList: BttvBadgesResponse = [];

const load: BadgesLoader = async (channelId, force = false) => {
  const hasLoaded = badgesList.length > 0;
  if (hasLoaded && !force) {
    return;
  }
  badgesList = await bttvBadgeService.getBadges();
};

export const bttvBadgesParser: BadgesParser = {
  provider: 'bttv',
  parse: async (badges, username) => {
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
