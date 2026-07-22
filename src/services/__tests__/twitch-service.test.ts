import type { DefaultTokenResponse } from '@app/types/twitch/auth';
import type { TwitchCheermote } from '@app/types/twitch/bits';
import type { FollowedChannel } from '@app/types/twitch/channel';
import type { TwitchClip, TwitchCreatedClip } from '@app/types/twitch/clip';
import type { UserInfoResponse } from '@app/types/twitch/user';

import { twitchApi } from '../api/clients';
import { MAX_FOLLOWED_CHANNELS, twitchService } from '../twitch-service';

const mockFetch = jest.fn();

jest.mock('expo/fetch', () => ({
  fetch: (...args: unknown[]) => mockFetch(...args) as Promise<unknown>,
}));

jest.mock('@app/lib/offThreadJson/parseJsonOnWorklet', () => ({
  parseJsonOnWorklet: jest.fn(async (text: string) => JSON.parse(text)),
}));

jest.mock('@app/utils/logger', () => {
  const categories: Record<string, unknown> = {};
  return {
    logger: new Proxy(
      {},
      {
        get: (_target, prop: string) => {
          categories[prop] ??= {
            debug: jest.fn(),
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
          };
          return categories[prop];
        },
      },
    ),
  };
});

jest.mock('../api/clients', () => ({
  getTwitchClientId: jest.fn(() => 'client-id'),
  isE2EMode: false,
  mockServerUrl: undefined,
  setTwitchClientId: jest.fn(),
  twitchApi: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}));

const api = jest.mocked(twitchApi);

function makeUser(id: string, displayName: string): UserInfoResponse {
  return {
    broadcaster_type: 'partner',
    created_at: '2013-06-03T19:12:02Z',
    description: '',
    display_name: displayName,
    id,
    login: displayName.toLowerCase(),
    offline_image_url: '',
    profile_image_url: `https://cdn.example.com/${id}.png`,
    type: '',
    view_count: 0,
  };
}

describe('twitchService.getUsersById', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('returns an empty list without a request when no ids are given', async () => {
    const result = await twitchService.getUsersById([]);

    expect(result).toEqual([]);
    expect(api.get).not.toHaveBeenCalled();
  });

  test('fetches users with repeated id params in a single request', async () => {
    api.get.mockResolvedValue({
      data: [makeUser('100', 'Zoil'), makeUser('200', 'Alet')],
    });

    const result = await twitchService.getUsersById(['100', '200']);

    expect(api.get).toHaveBeenCalledTimes(1);
    expect(api.get).toHaveBeenCalledWith('/users?id=100&id=200');
    expect(result.map(user => user.id)).toEqual(['100', '200']);
  });

  test('splits requests into batches of 100 ids', async () => {
    const ids = Array.from({ length: 150 }, (_, index) => String(index + 1));
    api.get.mockResolvedValue({ data: [] });

    await twitchService.getUsersById(ids);

    expect(api.get).toHaveBeenCalledTimes(2);
    const firstBatch = `/users?${ids
      .slice(0, 100)
      .map(id => `id=${id}`)
      .join('&')}`;
    const secondBatch = `/users?${ids
      .slice(100)
      .map(id => `id=${id}`)
      .join('&')}`;
    expect(api.get).toHaveBeenNthCalledWith(1, firstBatch);
    expect(api.get).toHaveBeenNthCalledWith(2, secondBatch);
  });
});

describe('twitchService.getClipsByIds', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  function makeClip(id: string): TwitchClip {
    return {
      id,
      url: `https://clips.twitch.tv/${id}`,
      embed_url: `https://clips.twitch.tv/embed?clip=${id}`,
      broadcaster_id: '100',
      broadcaster_name: 'Zoil',
      creator_id: '200',
      creator_name: 'Alet',
      video_id: 'v1',
      game_id: 'g1',
      language: 'en',
      title: `Clip ${id}`,
      view_count: 10,
      created_at: '2026-07-01T00:00:00Z',
      thumbnail_url: `https://cdn.example.com/${id}.jpg`,
      duration: 30,
      vod_offset: 120,
      is_featured: false,
    };
  }

  test('returns an empty list without a request when no ids are given', async () => {
    const result = await twitchService.getClipsByIds([]);

    expect(result).toEqual([]);
    expect(api.get).not.toHaveBeenCalled();
  });

  test('fetches clips with repeated id params in a single request', async () => {
    api.get.mockResolvedValue({ data: [makeClip('a'), makeClip('b')] });

    const result = await twitchService.getClipsByIds(['a', 'b']);

    expect(api.get).toHaveBeenCalledTimes(1);
    expect(api.get).toHaveBeenCalledWith('/clips?id=a&id=b');
    expect(result).toEqual<TwitchClip[]>([makeClip('a'), makeClip('b')]);
  });

  test('splits requests into batches of 100 ids and flattens the pages', async () => {
    const ids = Array.from({ length: 150 }, (_, index) => `clip${index + 1}`);
    api.get
      .mockResolvedValueOnce({ data: [makeClip('clip1')] })
      .mockResolvedValueOnce({ data: [makeClip('clip101')] });

    const result = await twitchService.getClipsByIds(ids);

    expect(api.get).toHaveBeenCalledTimes(2);
    const firstBatch = `/clips?${ids
      .slice(0, 100)
      .map(id => `id=${id}`)
      .join('&')}`;
    const secondBatch = `/clips?${ids
      .slice(100)
      .map(id => `id=${id}`)
      .join('&')}`;
    expect(api.get).toHaveBeenNthCalledWith(1, firstBatch);
    expect(api.get).toHaveBeenNthCalledWith(2, secondBatch);
    expect(result).toEqual<TwitchClip[]>([
      makeClip('clip1'),
      makeClip('clip101'),
    ]);
  });
});

describe('twitchService.getCheermotes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  function makeCheermote(prefix: string): TwitchCheermote {
    return {
      prefix,
      tiers: [
        {
          min_bits: 1,
          id: '1',
          color: '#979797',
          images: {
            dark: {
              animated: { '1': `https://cdn.example.com/${prefix}/dark/1.gif` },
              static: { '1': `https://cdn.example.com/${prefix}/dark/1.png` },
            },
            light: {
              animated: {
                '1': `https://cdn.example.com/${prefix}/light/1.gif`,
              },
              static: { '1': `https://cdn.example.com/${prefix}/light/1.png` },
            },
          },
          can_cheer: true,
          show_in_bits_card: true,
        },
      ],
      type: 'global_first_party',
      order: 1,
      last_updated: '2026-07-01T00:00:00Z',
      is_charitable: false,
    };
  }

  test('fetches global cheermotes without a broadcaster id', async () => {
    api.get.mockResolvedValue({ data: [makeCheermote('Cheer')] });

    const result = await twitchService.getCheermotes();

    expect(api.get).toHaveBeenCalledWith('/bits/cheermotes', { params: {} });
    expect(result).toEqual<TwitchCheermote[]>([makeCheermote('Cheer')]);
  });

  test('passes the broadcaster id for channel cheermotes', async () => {
    api.get.mockResolvedValue({ data: [makeCheermote('Pog')] });

    const result = await twitchService.getCheermotes('42');

    expect(api.get).toHaveBeenCalledWith('/bits/cheermotes', {
      params: { broadcaster_id: '42' },
    });
    expect(result).toEqual<TwitchCheermote[]>([makeCheermote('Pog')]);
  });
});

describe('twitchService.getFollowedChannels', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  function makeFollowedChannel(id: string): FollowedChannel {
    return {
      broadcaster_id: id,
      broadcaster_login: `channel${id}`,
      broadcaster_name: `Channel${id}`,
      followed_at: '2024-01-01T00:00:00Z',
    };
  }

  test('fetches a single page when no cursor is returned', async () => {
    api.get.mockResolvedValue({ data: [makeFollowedChannel('1')] });

    const result = await twitchService.getFollowedChannels('42');

    expect(result).toEqual<FollowedChannel[]>([makeFollowedChannel('1')]);
    expect(api.get).toHaveBeenCalledTimes(1);
    expect(api.get).toHaveBeenCalledWith('/channels/followed', {
      params: { user_id: '42', first: 100 },
    });
  });

  test('follows pagination cursors until exhausted', async () => {
    api.get
      .mockResolvedValueOnce({
        data: [makeFollowedChannel('1')],
        pagination: { cursor: 'abc' },
      })
      .mockResolvedValueOnce({ data: [makeFollowedChannel('2')] });

    const result = await twitchService.getFollowedChannels('42');

    expect(result).toEqual<FollowedChannel[]>([
      makeFollowedChannel('1'),
      makeFollowedChannel('2'),
    ]);
    expect(api.get).toHaveBeenCalledTimes(2);
    expect(api.get).toHaveBeenLastCalledWith('/channels/followed', {
      params: { user_id: '42', first: 100, after: 'abc' },
    });
  });

  test('stops paginating once the channel cap is reached', async () => {
    const pageSize = 100;
    const page = Array.from({ length: pageSize }, (_, index) =>
      makeFollowedChannel(String(index)),
    );
    api.get.mockResolvedValue({ data: page, pagination: { cursor: 'next' } });

    const result = await twitchService.getFollowedChannels('42');

    expect(result).toHaveLength(MAX_FOLLOWED_CHANNELS);
    expect(api.get).toHaveBeenCalledTimes(MAX_FOLLOWED_CHANNELS / pageSize);
  });

  test('stops paginating when a cursor page returns no further cursor', async () => {
    api.get
      .mockResolvedValueOnce({
        data: [makeFollowedChannel('1')],
        pagination: { cursor: 'abc' },
      })
      .mockResolvedValueOnce({
        data: [makeFollowedChannel('2')],
        pagination: {},
      });

    const result = await twitchService.getFollowedChannels('42');

    expect(result).toEqual<FollowedChannel[]>([
      makeFollowedChannel('1'),
      makeFollowedChannel('2'),
    ]);
    expect(api.get).toHaveBeenCalledTimes(2);
  });
});

describe('twitchService.createClip', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('posts to /clips and returns the created clip', async () => {
    api.post.mockResolvedValue({
      data: [{ id: 'clip-1', edit_url: 'https://clips.twitch.tv/clip-1/edit' }],
    });

    const result = await twitchService.createClip('42');

    expect(api.post).toHaveBeenCalledWith('/clips', undefined, {
      params: { broadcaster_id: '42' },
    });
    expect(result).toEqual<TwitchCreatedClip>({
      id: 'clip-1',
      edit_url: 'https://clips.twitch.tv/clip-1/edit',
    });
  });

  test('returns null when Twitch produces no clip', async () => {
    api.post.mockResolvedValue({ data: [] });

    await expect(twitchService.createClip('42')).resolves.toBeNull();
  });
});

describe('twitchService moderation endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('banChatUser posts a timeout with duration and reason', async () => {
    api.post.mockResolvedValue(undefined);

    await twitchService.banChatUser('1', '2', '3', {
      durationSeconds: 600,
      reason: 'spam',
    });

    expect(api.post).toHaveBeenCalledWith(
      '/moderation/bans',
      { data: { user_id: '3', duration: 600, reason: 'spam' } },
      { params: { broadcaster_id: '1', moderator_id: '2' } },
    );
  });

  test('banChatUser posts a permanent ban without a duration', async () => {
    api.post.mockResolvedValue(undefined);

    await twitchService.banChatUser('1', '2', '3');

    expect(api.post).toHaveBeenCalledWith(
      '/moderation/bans',
      { data: { user_id: '3' } },
      { params: { broadcaster_id: '1', moderator_id: '2' } },
    );
  });

  test('unbanChatUser deletes the ban', async () => {
    api.delete.mockResolvedValue(undefined);

    await twitchService.unbanChatUser('1', '2', '3');

    expect(api.delete).toHaveBeenCalledWith('/moderation/bans', {
      params: { broadcaster_id: '1', moderator_id: '2', user_id: '3' },
    });
  });

  test('deleteChatMessage targets the message id', async () => {
    api.delete.mockResolvedValue(undefined);

    await twitchService.deleteChatMessage('1', '2', 'msg-9');

    expect(api.delete).toHaveBeenCalledWith('/moderation/chat', {
      params: { broadcaster_id: '1', moderator_id: '2', message_id: 'msg-9' },
    });
  });

  test('warnChatUser posts the warning reason', async () => {
    api.post.mockResolvedValue(undefined);

    await twitchService.warnChatUser('1', '2', '3', 'be nice');

    expect(api.post).toHaveBeenCalledWith(
      '/moderation/warnings',
      { data: { user_id: '3', reason: 'be nice' } },
      { params: { broadcaster_id: '1', moderator_id: '2' } },
    );
  });

  test('updateChatSettings patches only provided fields', async () => {
    api.patch.mockResolvedValue(undefined);

    await twitchService.updateChatSettings('1', '2', {
      slow_mode: true,
      slow_mode_wait_time: 30,
    });

    expect(api.patch).toHaveBeenCalledWith(
      '/chat/settings',
      { slow_mode: true, slow_mode_wait_time: 30 },
      { params: { broadcaster_id: '1', moderator_id: '2' } },
    );
  });

  test('updateShieldMode puts the active flag', async () => {
    api.put.mockResolvedValue(undefined);

    await twitchService.updateShieldMode('1', '2', true);

    expect(api.put).toHaveBeenCalledWith(
      '/moderation/shield_mode',
      { is_active: true },
      { params: { broadcaster_id: '1', moderator_id: '2' } },
    );
  });

  test('sendChatAnnouncement posts the message', async () => {
    api.post.mockResolvedValue(undefined);

    await twitchService.sendChatAnnouncement('1', '2', 'drops enabled');

    expect(api.post).toHaveBeenCalledWith(
      '/chat/announcements',
      { message: 'drops enabled' },
      { params: { broadcaster_id: '1', moderator_id: '2' } },
    );
  });

  test('sendShoutout posts the broadcaster pair', async () => {
    api.post.mockResolvedValue(undefined);

    await twitchService.sendShoutout('1', '9', '2');

    expect(api.post).toHaveBeenCalledWith('/chat/shoutouts', undefined, {
      params: {
        from_broadcaster_id: '1',
        to_broadcaster_id: '9',
        moderator_id: '2',
      },
    });
  });
});

describe('twitchService.getDefaultToken', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  function jsonResponse(body: unknown, status = 200) {
    return {
      ok: status < 400,
      status,
      text: () => Promise.resolve(JSON.stringify(body)),
    };
  }

  function pendingUntilAbort(init?: { signal?: AbortSignal }): Promise<never> {
    return new Promise((_resolve, reject) => {
      init?.signal?.addEventListener('abort', () => {
        reject(new Error('Aborted'));
      });
    });
  }

  const anonToken: DefaultTokenResponse = {
    access_token: 'anon-abc',
    expires_in: 3600,
    token_type: 'bearer',
  };

  test('returns the anon token when the proxy and validation respond', async () => {
    mockFetch
      .mockResolvedValueOnce(jsonResponse({ data: anonToken }))
      .mockResolvedValueOnce(
        jsonResponse({ client_id: 'client-id', expires_in: 3600 }),
      );

    const result = await twitchService.getDefaultToken();

    expect(result).toEqual<DefaultTokenResponse>(anonToken);
  });

  test('keeps the fetched token when validation never responds', async () => {
    jest.useFakeTimers();
    try {
      mockFetch
        .mockResolvedValueOnce(jsonResponse({ data: anonToken }))
        .mockImplementationOnce(
          (_input: unknown, init?: { signal?: AbortSignal }) =>
            pendingUntilAbort(init),
        );

      const pending = twitchService.getDefaultToken();
      await jest.advanceTimersByTimeAsync(8_000);

      expect(await pending).toEqual<DefaultTokenResponse>(anonToken);
    } finally {
      jest.useRealTimers();
    }
  });

  test('returns undefined when the proxy rejects the request', async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({ message: 'Forbidden' }, 403),
    );

    const result = await twitchService.getDefaultToken();

    expect(result).toBeUndefined();
  });

  test('propagates the error when the token request never responds', async () => {
    jest.useFakeTimers();
    try {
      mockFetch.mockImplementationOnce(
        (_input: unknown, init?: { signal?: AbortSignal }) =>
          pendingUntilAbort(init),
      );

      const pending = twitchService.getDefaultToken();
      const assertion = expect(pending).rejects.toThrow('Aborted');
      await jest.advanceTimersByTimeAsync(8_000);
      await assertion;
    } finally {
      jest.useRealTimers();
    }
  });
});
