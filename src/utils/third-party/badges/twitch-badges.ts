/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { twitchBadgeService } from '@app/services';
import type {
  TwitchBadgesList,
  ParsedBadges,
  BadgesParser,
  BadgesLoader,
} from '../types';

let badgesList: TwitchBadgesList = [];

const load: BadgesLoader = async (channelId, _force = false) => {
  const [channelBadges, globalBadges] = await Promise.all([
    channelId ? twitchBadgeService.getChannelBadges(channelId) : [],
    twitchBadgeService.getTwitchGlobalBadges(),
  ]);

  badgesList = [...channelBadges, ...globalBadges];
};

export const twitchBadgesParser: BadgesParser = {
  provider: 'twitch',
  parse: async (badges, _username, channelId) => {
    await load(channelId);
    return Object.keys(badges)
      .map(badgeId => {
        // console.log('badge id', badgeId);
        const version = badges[badgeId];
        const badge = badgesList.find(
          x =>
            x.id === badgeId &&
            x.versionId === version &&
            (x.channelId === channelId || x.channelId == null),
        );

        if (!badge) {
          console.log('no badge...');
          return null;
        }

        console.log('images ->', badge.images);

        return {
          id: badge.id,
          title: badge.title,
          images: [badge.images[0]],
        };
      })
      .filter(x => !!x) as ParsedBadges;
  },
  load,
};
