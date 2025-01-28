import {
  sevenTvService as _sevenTvService,
  GetEmoteResponse,
} from '@app/services';
import { stvMessageParser } from '../7tv-emotes';

jest.mock('@app/services/seventTvService');

const sevenTvService = jest.mocked(_sevenTvService);

const mockGetEmoteResponse: GetEmoteResponse = {
  id: '01FHPDFPMG000DWASEV07BSCYM',
  name: 'SteerR',
  flags: 256,
  tags: ['christmas', 'xmas', 'holiday'],
  lifecycle: 3,
  state: ['LISTED'],
  listed: true,
  animated: true,
  createdAt: 1,
  host: {
    url: '//cdn.7tv.app/emote/01FHPDFPMG000DWASEV07BSCYM',
    files: [
      {
        name: '1x.webp',
        static_name: '1x_static.webp',
        width: 32,
        height: 32,
        frame_count: 19,
        size: 12584,
        format: 'WEBP',
      },
      {
        name: '2x.webp',
        static_name: '2x_static.webp',
        width: 64,
        height: 64,
        frame_count: 19,
        size: 23306,
        format: 'WEBP',
      },
      {
        name: '3x.webp',
        static_name: '3x_static.webp',
        width: 96,
        height: 96,
        frame_count: 19,
        size: 37594,
        format: 'WEBP',
      },
      {
        name: '4x.webp',
        static_name: '4x_static.webp',
        width: 128,
        height: 128,
        frame_count: 19,
        size: 38388,
        format: 'WEBP',
      },
      {
        name: '1x.avif',
        static_name: '1x_static.avif',
        width: 32,
        height: 32,
        frame_count: 19,
        size: 12126,
        format: 'AVIF',
      },
      {
        name: '2x.avif',
        static_name: '2x_static.avif',
        width: 64,
        height: 64,
        frame_count: 19,
        size: 23509,
        format: 'AVIF',
      },
      {
        name: '3x.avif',
        static_name: '3x_static.avif',
        width: 96,
        height: 96,
        frame_count: 19,
        size: 38195,
        format: 'AVIF',
      },
      {
        name: '4x.avif',
        static_name: '4x_static.avif',
        width: 128,
        height: 128,
        frame_count: 19,
        size: 42012,
        format: 'AVIF',
      },
      {
        name: '1x.gif',
        static_name: '1x_static.gif',
        width: 32,
        height: 32,
        frame_count: 19,
        size: 6726,
        format: 'GIF',
      },
      {
        name: '2x.gif',
        static_name: '2x_static.gif',
        width: 64,
        height: 64,
        frame_count: 19,
        size: 17442,
        format: 'GIF',
      },
      {
        name: '3x.gif',
        static_name: '3x_static.gif',
        width: 96,
        height: 96,
        frame_count: 19,
        size: 31964,
        format: 'GIF',
      },
      {
        name: '4x.gif',
        static_name: '4x_static.gif',
        width: 128,
        height: 128,
        frame_count: 19,
        size: 50521,
        format: 'GIF',
      },
    ],
  },
  versions: [
    {
      id: '01FHPDFPMG000DWASEV07BSCYM',
      name: 'SteerR',
      description: '',
      lifecycle: 3,
      state: ['LISTED'],
      listed: true,
      animated: true,
      host: {
        url: '//cdn.7tv.app/emote/01FHPDFPMG000DWASEV07BSCYM',
        files: [
          {
            name: '1x.webp',
            static_name: '1x_static.webp',
            width: 32,
            height: 32,
            frame_count: 19,
            size: 12584,
            format: 'WEBP',
          },
          {
            name: '2x.webp',
            static_name: '2x_static.webp',
            width: 64,
            height: 64,
            frame_count: 19,
            size: 23306,
            format: 'WEBP',
          },
          {
            name: '3x.webp',
            static_name: '3x_static.webp',
            width: 96,
            height: 96,
            frame_count: 19,
            size: 37594,
            format: 'WEBP',
          },
          {
            name: '4x.webp',
            static_name: '4x_static.webp',
            width: 128,
            height: 128,
            frame_count: 19,
            size: 38388,
            format: 'WEBP',
          },
          {
            name: '1x.avif',
            static_name: '1x_static.avif',
            width: 32,
            height: 32,
            frame_count: 19,
            size: 12126,
            format: 'AVIF',
          },
          {
            name: '2x.avif',
            static_name: '2x_static.avif',
            width: 64,
            height: 64,
            frame_count: 19,
            size: 23509,
            format: 'AVIF',
          },
          {
            name: '3x.avif',
            static_name: '3x_static.avif',
            width: 96,
            height: 96,
            frame_count: 19,
            size: 38195,
            format: 'AVIF',
          },
          {
            name: '4x.avif',
            static_name: '4x_static.avif',
            width: 128,
            height: 128,
            frame_count: 19,
            size: 42012,
            format: 'AVIF',
          },
          {
            name: '1x.gif',
            static_name: '1x_static.gif',
            width: 32,
            height: 32,
            frame_count: 19,
            size: 6726,
            format: 'GIF',
          },
          {
            name: '2x.gif',
            static_name: '2x_static.gif',
            width: 64,
            height: 64,
            frame_count: 19,
            size: 17442,
            format: 'GIF',
          },
          {
            name: '3x.gif',
            static_name: '3x_static.gif',
            width: 96,
            height: 96,
            frame_count: 19,
            size: 31964,
            format: 'GIF',
          },
          {
            name: '4x.gif',
            static_name: '4x_static.gif',
            width: 128,
            height: 128,
            frame_count: 19,
            size: 50521,
            format: 'GIF',
          },
        ],
      },
    },
  ],
};

describe('stvMessageParser', () => {
  test('should load emotes if emote matches', async () => {
    sevenTvService.getChannelEmotes.mockResolvedValue([
      { id: '1', code: 'Kappa', channelId: '123', isZeroWidth: false },
    ]);

    sevenTvService.getGlobalEmotes.mockResolvedValue([
      { id: '2', code: 'PogChamp', channelId: null, isZeroWidth: false },
    ]);

    sevenTvService.getEmote.mockResolvedValue(mockGetEmoteResponse);

    await stvMessageParser.load('123');

    const parsed = await stvMessageParser.parse(
      [
        { content: 'Kappa', position: '0-4' },
        { content: 'is', position: '6-7' },
        { content: 'PogChamp', position: '9-16' },
      ],
      {},
      {
        channelId: '123',
        providers: {
          bttv: false,
          ffz: false,
          seventv: true,
          twitch: false,
        },
      },
    );

    expect(parsed).toEqual([
      {
        content: 'Kappa',
        emote: {
          images: [
            {
              height: 17,
              url: 'https://cdn.7tv.app/emote/01FHPDFPMG000DWASEV07BSCYM/1x.webp',
              width: 17,
            },
            {
              height: 49,
              url: 'https://cdn.7tv.app/emote/01FHPDFPMG000DWASEV07BSCYM/2x.webp',
              width: 49,
            },
            {
              height: 81,
              url: 'https://cdn.7tv.app/emote/01FHPDFPMG000DWASEV07BSCYM/3x.webp',
              width: 81,
            },
            {
              height: 113,
              url: 'https://cdn.7tv.app/emote/01FHPDFPMG000DWASEV07BSCYM/4x.webp',
              width: 113,
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
        content: 'PogChamp',
        position: '9-16',
      },
    ]);
  });

  test('returns text if no emote found', async () => {
    sevenTvService.getChannelEmotes.mockResolvedValue([
      { id: '1', code: 'Kappa', channelId: '123', isZeroWidth: false },
    ]);

    sevenTvService.getGlobalEmotes.mockResolvedValue([
      { id: '2', code: 'PogChamp', channelId: null, isZeroWidth: false },
    ]);

    sevenTvService.getEmote.mockResolvedValue(mockGetEmoteResponse);

    const parsed = await stvMessageParser.parse(
      [
        { content: 'this', position: '0-4' },
        { content: 'is', position: '6-7' },
        { content: 'a test!', position: '9-16' },
      ],
      {},
      {
        channelId: '123',
        providers: {
          bttv: false,
          ffz: false,
          seventv: true,
          twitch: false,
        },
      },
    );

    expect(parsed).toEqual([
      {
        content: 'this',
        position: '0-4',
      },
      {
        content: 'is',
        position: '6-7',
      },
      {
        content: 'a test!',
        position: '9-16',
      },
    ]);
  });
});
