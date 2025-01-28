import { ffzBadgeService } from '@app/services';
import type {
  BadgesLoader,
  BadgesParser,
  FfzBadge,
  FfzBadgeUsers,
  ParsedBadges,
} from '../types';

let badgesList: FfzBadge[] = [];
let badgeUsers: FfzBadgeUsers = {};
const badgeCache: { badgesList: FfzBadge[]; badgeUsers: FfzBadgeUsers } = {
  badgesList: [],
  badgeUsers: {},
};

const load: BadgesLoader = async (_channelId, force = false) => {
  const hasLoaded = badgesList.length > 0 || Object.keys(badgeUsers).length > 0;
  if (hasLoaded && !force) {
    return;
  }

  if (badgeCache.badgesList.length > 0 && !force) {
    badgesList = badgeCache.badgesList;
    badgeUsers = badgeCache.badgeUsers;
    return;
  }

  const badgesData = await ffzBadgeService.getBadges();
  badgesList = badgesData.badges;
  badgeUsers = badgesData.users;

  badgeCache.badgesList = badgesList;
  badgeCache.badgeUsers = badgeUsers;
};

export const ffzBadgesParser: BadgesParser = {
  provider: 'ffz',
  parse: async (_badges, username) => {
    await load(null);
    return Object.keys(badgeUsers)
      .map(badgeId => {
        const users = badgeUsers[badgeId] ?? [];
        if (!users.find(x => x === username)) {
          return null;
        }

        const badge = badgesList.find(x => x.id === parseInt(badgeId, 10));
        if (!badge) {
          return null;
        }

        return {
          id: badge.id,
          title: badge.title,
          slot: badge.slot,
          replaces: badge.replaces,
          color: badge.color,
          images: Object.values(badge.urls),
        };
      })
      .filter(x => !!x) as unknown as ParsedBadges;
  },
  load,
};
