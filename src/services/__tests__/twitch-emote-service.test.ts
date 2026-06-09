import { twitchApi as _twitchApi } from '@app/services/api/clients';
import { twitchEmoteService } from '@app/services/twitch-emote-service';

jest.mock('@app/services/api/clients');
jest.mock('@app/services/twitch-service', () => ({
  twitchService: {
    getUser: jest.fn(),
  },
}));

const twitchApi = jest.mocked(_twitchApi);

describe('twitchEmoteService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('getSubscriberEmotes preserves owner_id on sanitised emotes', async () => {
    twitchApi.get.mockResolvedValue({
      data: [
        {
          id: 'emote-1',
          name: 'SubEmote',
          emote_type: 'subscriptions',
          emote_set_id: 'set-1',
          owner_id: 'channel-owner',
          format: ['static'],
          scale: ['1.0'],
          theme_mode: ['dark'],
        },
      ],
      pagination: {},
    } as unknown as Awaited<ReturnType<typeof twitchApi.get>>);

    const emotes = await twitchEmoteService.getSubscriberEmotes('user-1');

    expect(emotes).toEqual([
      {
        name: 'SubEmote',
        id: 'emote-1',
        url: 'https://static-cdn.jtvnw.net/emoticons/v2/emote-1/default/dark/3.0',
        static_url:
          'https://static-cdn.jtvnw.net/emoticons/v2/emote-1/static/dark/3.0',
        image_variants: {
          animated: {
            '2x': 'https://static-cdn.jtvnw.net/emoticons/v2/emote-1/default/dark/2.0',
            '4x': 'https://static-cdn.jtvnw.net/emoticons/v2/emote-1/default/dark/3.0',
          },
          static: {
            '2x': 'https://static-cdn.jtvnw.net/emoticons/v2/emote-1/static/dark/2.0',
            '4x': 'https://static-cdn.jtvnw.net/emoticons/v2/emote-1/static/dark/3.0',
          },
        },
        emote_link:
          'https://static-cdn.jtvnw.net/emoticons/v2/emote-1/default/dark/3.0',
        creator: null,
        original_name: 'SubEmote',
        site: 'Twitch Subscriber',
        owner_id: 'channel-owner',
      },
    ]);
  });
});
