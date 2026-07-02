import type { UserInfoResponse } from '@app/types/twitch/user';

import { twitchApi } from '../api/clients';
import { twitchService } from '../twitch-service';

jest.mock('../api/clients', () => ({
  getTwitchClientId: jest.fn(() => 'client-id'),
  isE2EMode: false,
  mockServerUrl: undefined,
  setTwitchClientId: jest.fn(),
  twitchApi: { get: jest.fn() },
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
