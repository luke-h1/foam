import { bttvService as _bttvService } from '@app/services';
import { EmotesList } from '../../types';
import { bttvMessageParser } from '../bttv-emotes';

jest.mock('@app/services/bttvService');

const bttvService = jest.mocked(_bttvService);

const mockGetChannelEmotesResponse: EmotesList = [
  {
    id: '5e8b709b518d2b5ce0b0f069',
    code: 'zoilGiggles',
    channelId: '123',
    isZeroWidth: false,
  },
  {
    id: '5ed1eda810aaa55e29473195',
    code: 'djShaq',
    isZeroWidth: false,
    channelId: '123',
  },
];

const mockGetGlobalEmotesResponse: EmotesList = [
  {
    id: '5f00c29ca2ac6205303619b2',
    code: 'donkPls',
    channelId: '123',
    isZeroWidth: false,
  },
];

describe('bttvMessageParser', () => {
  test('should parse message with emotes if emotes are in channelId', async () => {
    bttvService.getChannelEmotes.mockResolvedValue(
      mockGetChannelEmotesResponse,
    );
    bttvService.getGlobalEmotes.mockResolvedValue(mockGetGlobalEmotesResponse);

    const message = [
      {
        content: 'zoilGiggles',
        position: '0-4',
      },
      {
        content: 'is',
        position: '6-7',
      },
      {
        content: 'djShaq',
        position: '9-16',
      },
    ];

    const parsed = await bttvMessageParser.parse(
      message,
      {},
      {
        channelId: '123',
      },
    );

    expect(parsed).toEqual([
      {
        content: 'zoilGiggles',
        emote: {
          images: [
            {
              height: 22,
              url: 'https://cdn.betterttv.net/emote/5e8b709b518d2b5ce0b0f069/1x',
              width: 22,
            },
            {
              height: 44,
              url: 'https://cdn.betterttv.net/emote/5e8b709b518d2b5ce0b0f069/2x',
              width: 44,
            },
            {
              height: 66,
              url: 'https://cdn.betterttv.net/emote/5e8b709b518d2b5ce0b0f069/3x',
              width: 66,
            },
          ],
          isZeroWidth: false,
        },
        position: '0-4',
      },
      {
        content: 'is',
        position: '6-7',
      },
      {
        content: 'djShaq',
        emote: {
          images: [
            {
              height: 22,
              url: 'https://cdn.betterttv.net/emote/5ed1eda810aaa55e29473195/1x',
              width: 22,
            },
            {
              height: 44,
              url: 'https://cdn.betterttv.net/emote/5ed1eda810aaa55e29473195/2x',
              width: 44,
            },
            {
              height: 66,
              url: 'https://cdn.betterttv.net/emote/5ed1eda810aaa55e29473195/3x',
              width: 66,
            },
          ],
          isZeroWidth: false,
        },
        position: '9-16',
      },
    ]);
  });

  test('returns no images if channelId does not match emote set', async () => {
    bttvService.getChannelEmotes.mockResolvedValue(
      mockGetChannelEmotesResponse,
    );
    bttvService.getGlobalEmotes.mockResolvedValue(mockGetGlobalEmotesResponse);

    const message = [
      {
        content: 'zoilGiggles',
        position: '0-4',
      },
      {
        content: 'is',
        position: '6-7',
      },
      {
        content: 'djShaq',
        position: '9-16',
      },
    ];

    const parsed = await bttvMessageParser.parse(
      message,
      {},
      {
        channelId: '123456',
      },
    );

    expect(parsed).toEqual([
      {
        content: 'zoilGiggles',
        position: '0-4',
      },
      {
        content: 'is',
        position: '6-7',
      },
      {
        content: 'djShaq',
        position: '9-16',
      },
    ]);
  });
});
