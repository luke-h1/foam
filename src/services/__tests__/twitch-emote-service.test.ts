import type { TwitchSanitisedEmote } from '@app/types/emote';
import type { TwitchEmote } from '@app/types/twitch/emote';
import type { UserInfoResponse } from '@app/types/twitch/user';

import { twitchApi } from '../api/clients';
import { twitchEmoteService } from '../twitch-emote-service';
import { twitchService } from '../twitch-service';

jest.mock('../api/clients', () => ({
  twitchApi: { get: jest.fn() },
}));

jest.mock('../twitch-service', () => ({
  twitchService: { getUser: jest.fn() },
}));

const api = jest.mocked(twitchApi);
const mockTwitchService = jest.mocked(twitchService);

const broadcaster: UserInfoResponse = {
  broadcaster_type: 'partner',
  created_at: '2013-06-03T19:12:02Z',
  description: 'streams games',
  display_name: 'Streamer',
  id: '123',
  login: 'streamer',
  offline_image_url: '',
  profile_image_url: '',
  type: '',
  view_count: 0,
};

function makeTwitchEmote(id: string, name: string): TwitchEmote {
  return {
    id,
    name,
    emote_type: 'subscriptions',
    emote_set_id: 'set1',
    owner_id: '123',
    format: ['static'],
    scale: ['1.0', '2.0', '3.0'],
    theme_mode: ['light', 'dark'],
  };
}

describe('twitchEmoteService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('getGlobalEmotes sanitises global emotes from the helix cdn templates', async () => {
    api.get.mockResolvedValue({
      data: [
        {
          id: '25',
          name: 'Kappa',
          images: {
            url_1x:
              'https://static-cdn.jtvnw.net/emoticons/v2/25/static/light/1.0',
            url_2x:
              'https://static-cdn.jtvnw.net/emoticons/v2/25/static/light/2.0',
            url_4x:
              'https://static-cdn.jtvnw.net/emoticons/v2/25/static/light/3.0',
          },
          format: ['static'],
          scale: ['1.0', '2.0', '3.0'],
          theme_mode: ['light', 'dark'],
        },
      ],
    });

    const result = await twitchEmoteService.getGlobalEmotes();

    expect(api.get).toHaveBeenCalledWith('/chat/emotes/global');
    expect(result).toEqual<TwitchSanitisedEmote[]>([
      {
        name: 'Kappa',
        id: '25',
        url: 'https://static-cdn.jtvnw.net/emoticons/v2/25/default/dark/3.0',
        static_url:
          'https://static-cdn.jtvnw.net/emoticons/v2/25/static/dark/3.0',
        image_variants: {
          animated: {
            '2x': 'https://static-cdn.jtvnw.net/emoticons/v2/25/default/dark/2.0',
            '4x': 'https://static-cdn.jtvnw.net/emoticons/v2/25/default/dark/3.0',
          },
          static: {
            '2x': 'https://static-cdn.jtvnw.net/emoticons/v2/25/static/dark/2.0',
            '4x': 'https://static-cdn.jtvnw.net/emoticons/v2/25/static/dark/3.0',
          },
        },
        emote_link:
          'https://static-cdn.jtvnw.net/emoticons/v2/25/default/dark/3.0',
        original_name: 'Kappa',
        creator: null,
        site: 'Twitch Global',
      },
    ]);
  });

  test('getChannelEmotes resolves the broadcaster name as the creator', async () => {
    api.get.mockResolvedValue({
      data: [makeTwitchEmote('emotesv2_abc', 'streamerHi')],
      pagination: {},
    });
    mockTwitchService.getUser.mockResolvedValue(broadcaster);

    const result = await twitchEmoteService.getChannelEmotes('123');

    expect(api.get).toHaveBeenCalledWith('/chat/emotes', {
      params: { broadcaster_id: '123' },
    });
    expect(mockTwitchService.getUser).toHaveBeenCalledWith(undefined, '123');
    expect(
      result.map(emote => ({
        id: emote.id,
        creator: emote.creator,
        site: emote.site,
      })),
    ).toEqual([
      { id: 'emotesv2_abc', creator: 'Streamer', site: 'Twitch Channel' },
    ]);
  });

  test('getSubscriberEmotes follows the pagination cursor across pages', async () => {
    api.get
      .mockResolvedValueOnce({
        data: [makeTwitchEmote('emote1', 'subHype')],
        pagination: { cursor: 'cursor1' },
      })
      .mockResolvedValueOnce({
        data: [makeTwitchEmote('emote2', 'subLove')],
        pagination: {},
      });

    const result = await twitchEmoteService.getSubscriberEmotes('42', '123');

    expect(api.get).toHaveBeenNthCalledWith(1, '/chat/emotes/user', {
      params: { user_id: '42', broadcaster_id: '123', after: undefined },
    });
    expect(api.get).toHaveBeenNthCalledWith(2, '/chat/emotes/user', {
      params: { user_id: '42', broadcaster_id: '123', after: 'cursor1' },
    });
    expect(result.map(emote => ({ id: emote.id, site: emote.site }))).toEqual([
      { id: 'emote1', site: 'Twitch Subscriber' },
      { id: 'emote2', site: 'Twitch Subscriber' },
    ]);
  });

  test('getSubscriberEmotes keeps the owner_id of each emote', async () => {
    api.get.mockResolvedValue({
      data: [
        { ...makeTwitchEmote('emote1', 'subHype'), owner_id: '555' },
        { ...makeTwitchEmote('emote2', 'subLove'), owner_id: '777' },
      ],
      pagination: {},
    });

    const result = await twitchEmoteService.getSubscriberEmotes('42');

    expect(
      result.map(emote => ({ id: emote.id, owner_id: emote.owner_id })),
    ).toEqual([
      { id: 'emote1', owner_id: '555' },
      { id: 'emote2', owner_id: '777' },
    ]);
  });
});
