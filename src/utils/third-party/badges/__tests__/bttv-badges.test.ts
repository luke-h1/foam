import _bttvBadgeService from '@app/services/bttvBadgeService';
import { BttvBadgesResponse } from '../../types';
import { bttvBadgesParser } from '../bttv-badges';

jest.mock('@app/services/bttvBadgeService');

const bttvBadgeService = jest.mocked(_bttvBadgeService);

const mockBadgeResponse: BttvBadgesResponse = [
  {
    id: '550c2819ff8ecee922d2a421',
    name: 'decicus',
    displayName: 'Decicus',
    providerId: '25622621',
    badge: {
      type: 4,
      description: 'BetterTTV Translator',
      svg: 'https://cdn.betterttv.net/badges/translator.svg',
    },
  },
  {
    id: '5521b74562e6bd0027aee56b',
    name: 'cheesey',
    displayName: 'CHEESEY',
    providerId: '60105387',
    badge: {
      type: 3,
      description: 'BetterTTV Emote Approver',
      svg: 'https://cdn.betterttv.net/badges/emote_approver.svg',
    },
  },
];

describe('bttvBadges', () => {
  test.skip('parsedBadges for a user', async () => {
    // We need to actually pass badges correctly in here in order for us to parse and display an image
    bttvBadgeService.getBadges.mockResolvedValue(mockBadgeResponse);

    const badges = await bttvBadgesParser.parse({}, 'test_user', '123');
    expect(badges).toEqual([]);
  });
});
