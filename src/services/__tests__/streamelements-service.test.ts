import type { StreamElementsChatStats } from '@app/types/streamelements/stats';

import { ApiError } from '../api/client';
import { streamElementsApi } from '../api/clients';
import { streamElementsService } from '../streamelements-service';

const api = { get: jest.spyOn(streamElementsApi, 'get') };

const mockStats: StreamElementsChatStats = {
  channel: 'shroud',
  totalMessages: 69_134_962,
  uniqueChatters: 118_560,
  chatters: [],
  twitchEmotes: [],
  bttvEmotes: [],
  ffzEmotes: [],
  sevenTVEmotes: [],
};

describe('streamElementsService.getChatStats', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('url-encodes the channel name in the request path', async () => {
    api.get.mockResolvedValue(mockStats);

    const result = await streamElementsService.getChatStats('odd name');

    expect(api.get).toHaveBeenCalledWith('/chatstats/odd%20name/stats');

    expect(result).toEqual<StreamElementsChatStats>(mockStats);
  });

  test('resolves null for a channel StreamElements has no data for', async () => {
    api.get.mockRejectedValue(
      new ApiError('Not Found', 404, 'StreamElementsApiError'),
    );

    await expect(streamElementsService.getChatStats('nobody')).resolves.toEqual(
      null,
    );
  });

  test('rejects on any other failure', async () => {
    api.get.mockRejectedValue(
      new ApiError('Bad Gateway', 502, 'StreamElementsApiError'),
    );

    await expect(streamElementsService.getChatStats('nobody')).rejects.toThrow(
      'Bad Gateway',
    );
  });
});
