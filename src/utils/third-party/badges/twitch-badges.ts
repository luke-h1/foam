import { twitchBadgeService } from '@app/services';
import type {
  TwitchBadgesList,
  ParsedBadges,
  BadgesParser,
  BadgesLoader,
} from '../types';

let badgesList: TwitchBadgesList = [];

const load: BadgesLoader = async (channelId, force = false) => {
  badgesList = [
    ...badgesList,
    ...(
      await Promise.all([
        twitchBadgeService.getChannelBadges(channelId),
        twitchBadgeService.getTwitchGlobalBadges(),
      ])
    ).flat(),
  ];

  const hasLoaded = badgesList.length > 0;

  if (!hasLoaded) {
    return [];
  }
};

export const twitchBadgesParser: BadgesParser = {
  provider: 'twitch',
  parse: async (badges, username, channelId) => {
    await load(channelId);

    return Object.keys(badges)
      .map(badgeId => {
        const version = badges[badgeId];
        const badge = badgesList.find(x => {
          return (
            x.id === badgeId &&
            x.versionId === version &&
            (x.channelId === channelId || x.channelId == null)
          );
        });
        if (!badge) {
          console.log('no badge found...');
          return null;
        }

        console.log('found badge ->', badge);

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
