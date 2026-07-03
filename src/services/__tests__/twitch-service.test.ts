import type { FollowedChannel } from '@app/types/twitch/channel';
import type { UserInfoResponse } from '@app/types/twitch/user';

import { twitchApi } from '../api/clients';
import { twitchService } from '../twitch-service';

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
    const firstUrl = api.get.mock.calls[0]?.[0] as string;
    const secondUrl = api.get.mock.calls[1]?.[0] as string;
    expect(firstUrl.match(/id=/g)).toHaveLength(100);
    expect(secondUrl.match(/id=/g)).toHaveLength(50);
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

    expect(result).toEqual([makeFollowedChannel('1')]);
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

    expect(result).toEqual([
      makeFollowedChannel('1'),
      makeFollowedChannel('2'),
    ]);
    expect(api.get).toHaveBeenCalledTimes(2);
    expect(api.get).toHaveBeenLastCalledWith('/channels/followed', {
      params: { user_id: '42', first: 100, after: 'abc' },
    });
  });

  test('stops paginating once the channel cap is reached', async () => {
    const page = Array.from({ length: 100 }, (_, index) =>
      makeFollowedChannel(String(index)),
    );
    api.get.mockResolvedValue({ data: page, pagination: { cursor: 'next' } });

    const result = await twitchService.getFollowedChannels('42');

    expect(result).toHaveLength(400);
    expect(api.get).toHaveBeenCalledTimes(4);
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
    expect(result).toEqual({
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
