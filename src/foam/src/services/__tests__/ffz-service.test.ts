import type { FfzEmoticon } from '@app/types/ffz/emote';

import { ffzApi } from '../api/clients';
import { ffzService } from '../ffz-service';

jest.mock('../api/clients', () => ({
  ffzApi: { get: jest.fn() },
}));

const api = jest.mocked(ffzApi);

const staticEmote: FfzEmoticon = {
  id: 128054,
  name: 'OMEGALUL',
  height: 32,
  width: 32,
  public: true,
  hidden: false,
  animated: false,
  modifier: false,
  modifier_flags: 0,
  owner: { _id: 1, name: 'dourgent', display_name: 'DourGent' },
  urls: {
    '1': 'https://cdn.frankerfacez.com/emote/128054/1',
    '2': 'https://cdn.frankerfacez.com/emote/128054/2',
    '4': 'https://cdn.frankerfacez.com/emote/128054/4',
  },
  status: 1,
  usage_count: 100,
  created_at: '2016-08-06T18:33:10.273Z',
  last_updated: '2016-08-06T18:36:23.605Z',
};

const animatedEmote: FfzEmoticon = {
  ...staticEmote,
  id: 720507,
  name: 'peepoDance',
  animated: true,
  width: 28,
  height: 32,
  urls: {
    '1': 'https://cdn.frankerfacez.com/emote/720507/1',
    '2': 'https://cdn.frankerfacez.com/emote/720507/2',
    '4': 'https://cdn.frankerfacez.com/emote/720507/4',
  },
};

describe('ffzService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('getSanitisedGlobalEmotes sanitises the default global set', async () => {
    api.get.mockResolvedValue({
      default_sets: [3],
      sets: {
        '3': { id: 3, _type: 0, title: 'Global', emoticons: [staticEmote] },
      },
      users: {},
    });

    const result = await ffzService.getSanitisedGlobalEmotes();

    expect(api.get).toHaveBeenCalledWith('/set/global');
    expect(result).toEqual([
      {
        name: 'OMEGALUL',
        id: '128054',
        url: 'https://cdn.frankerfacez.com/emote/128054/4',
        static_url: 'https://cdn.frankerfacez.com/emote/128054/4',
        image_variants: {
          animated: {
            '2x': 'https://cdn.frankerfacez.com/emote/128054/2',
            '4x': 'https://cdn.frankerfacez.com/emote/128054/4',
          },
          static: {
            '2x': 'https://cdn.frankerfacez.com/emote/128054/2',
            '4x': 'https://cdn.frankerfacez.com/emote/128054/4',
          },
        },
        emote_link: 'https://www.frankerfacez.com/emoticon/128054',
        original_name: 'UNKNOWN',
        creator: 'UNKNOWN',
        site: 'Global FFZ',
        width: 32,
        height: 32,
        aspect_ratio: 1,
      },
    ]);
  });

  test('getSanitisedChannelEmotes builds animated variants and per-emote creators', async () => {
    api.get.mockResolvedValue({
      room: { set: 10 },
      sets: {
        '10': {
          id: 10,
          _type: 1,
          title: 'Channel',
          emoticons: [animatedEmote],
        },
      },
    });

    const result = await ffzService.getSanitisedChannelEmotes('123');

    expect(api.get).toHaveBeenCalledWith('/room/id/123');
    expect(result).toEqual([
      {
        name: 'peepoDance',
        id: '720507',
        url: 'https://cdn.frankerfacez.com/emote/720507/animated/4',
        static_url: 'https://cdn.frankerfacez.com/emote/720507/4',
        image_variants: {
          animated: {
            '2x': 'https://cdn.frankerfacez.com/emote/720507/animated/2',
            '4x': 'https://cdn.frankerfacez.com/emote/720507/animated/4',
          },
          static: {
            '2x': 'https://cdn.frankerfacez.com/emote/720507/2',
            '4x': 'https://cdn.frankerfacez.com/emote/720507/4',
          },
        },
        emote_link: 'https://www.frankerfacez.com/emoticon/720507',
        original_name: 'UNKNOWN',
        creator: 'dourgent',
        site: 'FFZ',
        width: 28,
        height: 32,
        aspect_ratio: 28 / 32,
      },
    ]);
  });

  test('getSanitisedChannelEmotes returns an empty list when the room does not exist', async () => {
    api.get.mockResolvedValue({
      status: 404,
      error: 'Not Found',
      message: 'No such room',
    });

    const result = await ffzService.getSanitisedChannelEmotes('999');

    expect(result).toEqual([]);
  });
});
