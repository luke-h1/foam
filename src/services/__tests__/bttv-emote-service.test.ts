import type { BttvEmote } from '@app/types/bttv/emote';
import type { BttvSanitisedEmote } from '@app/types/emote';

import { bttvCachedApi } from '../api/clients';
import { bttvEmoteService } from '../bttv-emote-service';

jest.mock('../api/clients', () => ({
  bttvCachedApi: { get: jest.fn() },
}));

const api = jest.mocked(bttvCachedApi);

const animatedEmote: BttvEmote = {
  id: 'emote1',
  code: 'catJAM',
  codeOriginal: 'catJAMOriginal',
  imageType: 'webp',
  animated: true,
  userId: 'user1',
  modifier: false,
  user: { name: 'creator1' },
};

const staticZeroWidthEmote: BttvEmote = {
  id: 'emote2',
  code: 'cvHazmat',
  imageType: 'png',
  animated: false,
  userId: 'user2',
  modifier: false,
};

describe('bttvEmoteService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('getSanitisedGlobalEmotes sanitises animated emotes with static png variants', async () => {
    api.get.mockResolvedValue([animatedEmote]);

    const result = await bttvEmoteService.getSanitisedGlobalEmotes();

    expect(api.get).toHaveBeenCalledWith('/emotes/global');
    expect(result).toEqual<BttvSanitisedEmote[]>([
      {
        name: 'catJAM',
        id: 'emote1',
        url: 'https://cdn.betterttv.net/emote/emote1/3x',
        static_url: 'https://cdn.betterttv.net/emote/emote1/3x.png',
        image_variants: {
          animated: {
            '2x': 'https://cdn.betterttv.net/emote/emote1/2x',
            '3x': 'https://cdn.betterttv.net/emote/emote1/3x',
          },
          static: {
            '2x': 'https://cdn.betterttv.net/emote/emote1/2x.png',
            '3x': 'https://cdn.betterttv.net/emote/emote1/3x.png',
          },
        },
        emote_link: 'https://betterttv.com/emotes/emote1',
        original_name: 'catJAMOriginal',
        creator: null,
        site: 'Global BTTV',
        flags: undefined,
      },
    ]);
  });

  test('getSanitisedGlobalEmotes reuses the default urls for static emotes and flags zero-width codes', async () => {
    api.get.mockResolvedValue([staticZeroWidthEmote]);

    const result = await bttvEmoteService.getSanitisedGlobalEmotes();

    expect(result).toEqual<BttvSanitisedEmote[]>([
      {
        name: 'cvHazmat',
        id: 'emote2',
        url: 'https://cdn.betterttv.net/emote/emote2/3x',
        static_url: 'https://cdn.betterttv.net/emote/emote2/3x',
        image_variants: {
          animated: {
            '2x': 'https://cdn.betterttv.net/emote/emote2/2x',
            '3x': 'https://cdn.betterttv.net/emote/emote2/3x',
          },
          static: {
            '2x': 'https://cdn.betterttv.net/emote/emote2/2x',
            '3x': 'https://cdn.betterttv.net/emote/emote2/3x',
          },
        },
        emote_link: 'https://betterttv.com/emotes/emote2',
        original_name: 'UNKNOWN',
        creator: null,
        site: 'Global BTTV',
        flags: 256,
      },
    ]);
  });

  test('getSanitisedChannelEmotes concatenates shared and channel emotes with per-emote creators', async () => {
    api.get.mockResolvedValue({
      id: 'channel1',
      bots: [],
      avatar: 'https://example.com/avatar.png',
      channelEmotes: [staticZeroWidthEmote],
      sharedEmotes: [animatedEmote],
    });

    const result = await bttvEmoteService.getSanitisedChannelEmotes('123');

    expect(api.get).toHaveBeenCalledWith('/users/twitch/123');
    expect(
      result.map(emote => ({ id: emote.id, creator: emote.creator })),
    ).toEqual([
      { id: 'emote1', creator: 'creator1' },
      { id: 'emote2', creator: null },
    ]);
    expect(result.map(emote => emote.site)).toEqual(['BTTV', 'BTTV']);
  });
});
