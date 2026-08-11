import type { SanitisedBadgeSet } from '@app/types/twitch/badge';

import { twitchApi } from '../api/clients';
import { twitchBadgeService } from '../twitch-badge-service';

jest.mock('../api/clients', () => ({
  twitchApi: { get: jest.fn() },
}));

const api = jest.mocked(twitchApi);

function makeVersion(id: string, title: string) {
  return {
    id,
    image_url_1x: `https://static-cdn.jtvnw.net/badges/v1/${id}/1`,
    image_url_2x: `https://static-cdn.jtvnw.net/badges/v1/${id}/2`,
    image_url_4x: `https://static-cdn.jtvnw.net/badges/v1/${id}/3`,
    title,
    description: title,
    click_action: '',
    click_url: null,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('twitchBadgeService.listSanitisedChannelBadges', () => {
  test('keeps campaign sets alongside subscriber and bits', async () => {
    api.get.mockResolvedValue({
      data: [
        {
          set_id: 'subscriber',
          versions: [makeVersion('12', '1-Year Subscriber')],
        },
        { set_id: 'bits', versions: [makeVersion('100', 'cheer 100')] },
        {
          set_id: 'campaign-96858382-cd01bbf6-mw',
          versions: [makeVersion('1', 'Multi-Month Sub')],
        },
      ],
    });

    const badges =
      await twitchBadgeService.listSanitisedChannelBadges('96858382');

    expect(badges).toEqual<SanitisedBadgeSet[]>([
      {
        id: '12',
        url: 'https://static-cdn.jtvnw.net/badges/v1/12/3',
        type: 'Twitch Subscriber Badge',
        provider: 'twitch',
        title: '1-Year Subscriber',
        set: 'subscriber',
      },
      {
        id: '100',
        url: 'https://static-cdn.jtvnw.net/badges/v1/100/3',
        type: 'Twitch Bit Badge',
        provider: 'twitch',
        title: 'Cheer 100',
        set: 'bits',
      },
      {
        id: '1',
        url: 'https://static-cdn.jtvnw.net/badges/v1/1/3',
        type: 'Twitch Channel Badge',
        provider: 'twitch',
        title: 'Multi-Month Sub',
        set: 'campaign-96858382-cd01bbf6-mw',
      },
    ]);
  });
});
