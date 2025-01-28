import { twitchBadgeService } from '@app/services';
import type {
  TwitchBadgesList,
  ParsedBadges,
  BadgesParser,
  BadgesLoader,
} from '../types';

let badgesList: TwitchBadgesList = [];
const badgeCache: { [key: string]: TwitchBadgesList } = {};

const load: BadgesLoader = async (channelId, force = false) => {
  const cacheKey = channelId || 'global';

  if (badgeCache[cacheKey] && !force) {
    badgesList = badgeCache?.[cacheKey] as TwitchBadgesList;
    return;
  }

  const [channelBadges, globalBadges] = await Promise.all([
    channelId ? twitchBadgeService.getChannelBadges(channelId) : [],
    twitchBadgeService.getGlobalBadges(),
  ]);

  badgesList = [...channelBadges, ...globalBadges];
  badgeCache[cacheKey] = badgesList;
};

export const twitchBadgesParser: BadgesParser = {
  provider: 'twitch',
  parse: async (badges, _username, channelId) => {
    await load(channelId);
    return Object.keys(badges)
      .map(badgeId => {
        const version = badges[badgeId];
        const badge = badgesList.find(
          x =>
            x.id === badgeId &&
            x.versionId === version &&
            (x.channelId === channelId || x.channelId === null),
        );
        if (!badge) {
          return null;
        }

        return {
          id: badge.id,
          title: badge.title,
          images: badge.images,
        };
      })
      .filter(x => !!x) as ParsedBadges;
  },
  load,
};
