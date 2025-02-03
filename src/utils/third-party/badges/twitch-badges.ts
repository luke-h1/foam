import { twitchBadgeService } from '@app/services';
import type {
  TwitchBadgesList,
  ParsedBadges,
  BadgesParser,
  BadgesLoader,
} from '../types';

let badgesList: TwitchBadgesList = [];

const load: BadgesLoader = async (channelId, force = false) => {
  const [channelBadges, globalBadges] = await Promise.all([
    channelId ? twitchBadgeService.getChannelBadges(channelId) : [],
    twitchBadgeService.getTwitchGlobalBadges(),
  ]);

  badgesList = [...channelBadges, ...globalBadges];
};

export const twitchBadgesParser: BadgesParser = {
  provider: 'twitch',
  parse: async (badges, username, channelId) => {
    await load(channelId);
    return Object.keys(badges)
      .map(badgeId => {
        // console.log('badge id', badgeId);
        const version = badges[badgeId];
        // const badge = badgesList.find(
        //   x =>
        //     x.id === badgeId &&
        //     x.versionId === version &&
        //     (x.channelId === channelId || x.channelId == null),
        // );

        const badge = badgesList.find(x => {
          console.log('x.id is', x.id);
          console.log('badgeId is', badgeId);

          return x.id === badgeId;
        });

        if (!badge) return null;
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
