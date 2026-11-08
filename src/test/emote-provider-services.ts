import { bttvEmoteService } from '@app/services/bttv-emote-service';
import { chatterinoService } from '@app/services/chatterino-service';
import { ffzService } from '@app/services/ffz-service';
import { sevenTvService } from '@app/services/seven-tv-service';
import { twitchBadgeService } from '@app/services/twitch-badge-service';
import { twitchEmoteService } from '@app/services/twitch-emote-service';
import { twitchService } from '@app/services/twitch-service';

/**
 * Replaces every emote and badge provider request with an empty result, so a
 * test that loads chat resources makes no network call. Call it again in
 * `beforeEach` to put the empty results back. A test gives one provider real
 * data through the returned spy for that request.
 */
export function stubEmoteProviderServices() {
  return {
    get7tvUserId: jest
      .spyOn(sevenTvService, 'get7tvUserId')
      .mockResolvedValue(''),
    getEmoteSetId: jest
      .spyOn(sevenTvService, 'getEmoteSetId')
      .mockResolvedValue(''),
    getSanitisedEmoteSet: jest
      .spyOn(sevenTvService, 'getSanitisedEmoteSet')
      .mockResolvedValue([]),
    getPersonalEmoteSet: jest
      .spyOn(sevenTvService, 'getPersonalEmoteSet')
      .mockResolvedValue([]),
    sendPresence: jest
      .spyOn(sevenTvService, 'sendPresence')
      .mockResolvedValue(undefined),
    fetchAllBadges: jest
      .spyOn(sevenTvService, 'fetchAllBadges')
      .mockResolvedValue([]),
    getChannelEmotes: jest
      .spyOn(twitchEmoteService, 'getChannelEmotes')
      .mockResolvedValue([]),
    getGlobalEmotes: jest
      .spyOn(twitchEmoteService, 'getGlobalEmotes')
      .mockResolvedValue([]),
    getSubscriberEmotes: jest
      .spyOn(twitchEmoteService, 'getSubscriberEmotes')
      .mockResolvedValue([]),
    getBttvGlobalEmotes: jest
      .spyOn(bttvEmoteService, 'getSanitisedGlobalEmotes')
      .mockResolvedValue([]),
    getBttvChannelEmotes: jest
      .spyOn(bttvEmoteService, 'getSanitisedChannelEmotes')
      .mockResolvedValue([]),
    getBttvGlobalBadges: jest
      .spyOn(bttvEmoteService, 'getSanitisedGlobalBadges')
      .mockResolvedValue([]),
    getFfzChannelEmotes: jest
      .spyOn(ffzService, 'getSanitisedChannelEmotes')
      .mockResolvedValue([]),
    getFfzGlobalEmotes: jest
      .spyOn(ffzService, 'getSanitisedGlobalEmotes')
      .mockResolvedValue([]),
    getFfzChannelBadges: jest
      .spyOn(ffzService, 'getSanitisedChannelBadges')
      .mockResolvedValue([]),
    getFfzGlobalBadges: jest
      .spyOn(ffzService, 'getSanitisedGlobalBadges')
      .mockResolvedValue([]),
    listTwitchChannelBadges: jest
      .spyOn(twitchBadgeService, 'listSanitisedChannelBadges')
      .mockResolvedValue([]),
    listTwitchGlobalBadges: jest
      .spyOn(twitchBadgeService, 'listSanitisedGlobalBadges')
      .mockResolvedValue([]),
    listChatterinoBadges: jest
      .spyOn(chatterinoService, 'listSanitisedBadges')
      .mockReturnValue([]),
    getUsersById: jest
      .spyOn(twitchService, 'getUsersById')
      .mockResolvedValue([]),
    getCheermotes: jest
      .spyOn(twitchService, 'getCheermotes')
      .mockResolvedValue([]),
  };
}
