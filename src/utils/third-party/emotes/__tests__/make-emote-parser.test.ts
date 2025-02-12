import { EmotesList } from '../../types';
import { makeEmoteParser } from '../make-emote-parser';

describe('makeEmoteParser', () => {
  const mockLoaders: ((channelId: string | null) => Promise<EmotesList>)[] = [
    async channelId => [
      {
        id: '1',
        code: 'Kappa',
        channelId: channelId || '123',
        isZeroWidth: false,
      },
    ],
  ];

  const mockGetEmoteURLs = async (emoteId: string) => [
    {
      width: 18,
      height: 18,
      url: `https://cdn.example.com/emote/${emoteId}/1x.webp`,
    },
    {
      width: 36,
      height: 36,
      url: `https://cdn.example.com/emote/${emoteId}/2x.webp`,
    },
    {
      width: 54,
      height: 54,
      url: `https://cdn.example.com/emote/${emoteId}/3x.webp`,
    },
  ];

  const emoteParser = makeEmoteParser('test', mockLoaders, mockGetEmoteURLs);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should load emotes', async () => {
    await emoteParser.load('123');

    expect(emoteParser.provider).toBe('test');
    expect(emoteParser.load).toBeDefined();
    expect(emoteParser.parse).toBeDefined();
  });

  test('should parse message with emotes', async () => {
    await emoteParser.load('123');

    const message = [
      { content: 'Kappa', position: '0-4' },
      { content: 'is', position: '6-7' },
      { content: 'PogChamp', position: '9-16' },
    ];

    const parsedMessage = await emoteParser.parse(
      message,
      {},
      {
        channelId: '123',
      },
    );

    expect(parsedMessage).toEqual([
      {
        content: 'Kappa',
        emote: {
          images: [
            {
              height: 18,
              url: 'https://cdn.example.com/emote/1/1x.webp',
              width: 18,
            },
            {
              height: 36,
              url: 'https://cdn.example.com/emote/1/2x.webp',
              width: 36,
            },
            {
              height: 54,
              url: 'https://cdn.example.com/emote/1/3x.webp',
              width: 54,
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

  test('should force reload emotes', async () => {
    await emoteParser.load('123');
    await emoteParser.load('123', true);

    expect(emoteParser.provider).toBe('test');
  });

  test('parse should return no emotes if no emotes are found', async () => {
    await emoteParser.load('123');

    const message = [
      { content: 'testing', position: '0-4' },
      { content: 'is', position: '6-7' },
      { content: 'dev', position: '9-16' },
    ];

    const parsedMessage = await emoteParser.parse(
      message,
      {},
      {
        channelId: '123',
      },
    );

    expect(parsedMessage).toEqual([
      {
        content: 'testing',
        position: '0-4',
      },
      {
        content: 'is',
        position: '6-7',
      },
      {
        content: 'dev',
        position: '9-16',
      },
    ]);
  });
});
