import _ffzService from '@app/services/ffzService';
import { EmotesList } from '../../types';
import { ffzMessageParser } from '../ffz-emotes';

jest.mock('@app/services/ffzService');

const ffzService = jest.mocked(_ffzService);

const mockGetChannelEmotesResponse: EmotesList = [
  {
    channelId: '25927',
    code: 'CatBag',
    id: '123',
    isZeroWidth: false,
  },
  {
    channelId: '757384',
    code: 'BibleThump',
    id: '456',
    isZeroWidth: false,
  },
];

const mockGetGlobalEmotesResponse: EmotesList = [
  {
    channelId: '721137',
    code: 'ffzBounce',
    id: '789',
    isZeroWidth: false,
  },
];

describe('ffzMessageParser', () => {
  test('should parse message with emotes if matches channelId', async () => {
    ffzService.getChannelEmotes.mockResolvedValue(mockGetChannelEmotesResponse);
    ffzService.getGlobalEmotes.mockResolvedValue(mockGetGlobalEmotesResponse);

    const message = [
      {
        content: 'CatBag',
        position: '0-4',
      },
      {
        content: 'is',
        position: '6-7',
      },
      {
        content: 'ffzBounce',
        position: '9-16',
      },
    ];

    const parsed = await ffzMessageParser.parse(
      message,
      {},
      {
        channelId: '25927',
        providers: {
          bttv: false,
          ffz: true,
          seventv: false,
          twitch: false,
        },
      },
    );

    expect(parsed).toEqual([
      {
        content: 'CatBag',
        emote: {
          images: [
            {
              height: 28,
              url: 'https://cdn.frankerfacez.com/emote/123/1',
              width: 28,
            },
            {
              height: 56,
              url: 'https://cdn.frankerfacez.com/emote/123/2',
              width: 56,
            },
            {
              height: 112,
              url: 'https://cdn.frankerfacez.com/emote/123/4',
              width: 112,
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
        content: 'ffzBounce',
        position: '9-16',
      },
    ]);

    expect(parsed).not.toEqual([
      {
        content: 'BibleThump',
        emote: {
          images: [
            {
              height: 28,
              url: 'https://cdn.frankerfacez.com/emote/456/1',
              width: 28,
            },
            {
              height: 56,
              url: 'https://cdn.frankerfacez.com/emote/456/2',
              width: 56,
            },
            {
              height: 112,
              url: 'https://cdn.frankerfacez.com/emote/456/4',
              width: 112,
            },
          ],
          isZeroWidth: false,
        },
        position: '0-4',
      },
    ]);
  });

  test('returns no images if channelId is not current channelId', async () => {
    ffzService.getChannelEmotes.mockResolvedValue(mockGetChannelEmotesResponse);
    ffzService.getGlobalEmotes.mockResolvedValue(mockGetGlobalEmotesResponse);

    const message = [
      {
        content: 'CatBag',
        position: '0-4',
      },
      {
        content: 'is',
        position: '6-7',
      },
      {
        content: 'ffzBounce',
        position: '9-16',
      },
    ];

    const parsed = await ffzMessageParser.parse(
      message,
      {},
      {
        channelId: 'unodostres',
        providers: {
          bttv: false,
          ffz: true,
          seventv: false,
          twitch: false,
        },
      },
    );

    expect(parsed).toEqual([
      {
        content: 'CatBag',
        position: '0-4',
      },
      {
        content: 'is',
        position: '6-7',
      },
      {
        content: 'ffzBounce',
        position: '9-16',
      },
    ]);
  });
});
