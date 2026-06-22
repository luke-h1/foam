import type { SanitisedBadgeSet } from '@app/services/twitch-badge-service';
import type {
  BttvSanitisedEmote,
  TwitchSanitisedEmote,
} from '@app/types/emote';

export const twitchGlobalEmotesFixture: TwitchSanitisedEmote[] = [
  {
    id: 'emotesv2_twitch_1',
    name: 'Kappa',
    url: 'https://static-cdn.jtvnw.net/emoticons/v2/25/default/dark/3.0',
    static_url: 'https://static-cdn.jtvnw.net/emoticons/v2/25/static/dark/3.0',
    original_name: 'Kappa',
    creator: null,
    emote_link: 'https://www.twitch.tv/emotes/25',
    site: 'Twitch Global',
  },
];

export const bttvGlobalEmotesFixture: BttvSanitisedEmote[] = [
  {
    id: 'bttv_global_1',
    name: 'SourPls',
    url: 'https://cdn.betterttv.net/emote/566ca38765dbbdab32ec0560/3x',
    static_url:
      'https://cdn.betterttv.net/emote/566ca38765dbbdab32ec0560/3x.png',
    original_name: 'UNKNOWN',
    creator: null,
    emote_link: 'https://betterttv.com/emotes/566ca38765dbbdab32ec0560',
    site: 'Global BTTV',
  },
];

export const twitchGlobalBadgesFixture: SanitisedBadgeSet[] = [
  {
    id: 'moderator_1_1',
    url: 'https://static-cdn.jtvnw.net/badges/v1/moderator/3',
    title: 'Moderator',
    type: 'Twitch Global Badge',
    set: 'moderator',
  },
];
