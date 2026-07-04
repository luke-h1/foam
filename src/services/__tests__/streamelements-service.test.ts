import type { StreamElementsChatStats } from '@app/types/streamelements/stats';

import { streamElementsApi } from '../api/clients';
import { streamElementsService } from '../streamelements-service';

jest.mock('../api/clients', () => ({
  streamElementsApi: { get: jest.fn() },
}));

const api = jest.mocked(streamElementsApi);

const mockStats: StreamElementsChatStats = {
  channel: 'shroud',
  totalMessages: 69134962,
  uniqueChatters: 118560,
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

  test('requests the channel chat stats endpoint and returns the payload', async () => {
    api.get.mockResolvedValue(mockStats);

    const result = await streamElementsService.getChatStats('shroud');

    expect(api.get).toHaveBeenCalledWith('/chatstats/shroud/stats');
    expect(result).toEqual<StreamElementsChatStats>(mockStats);
  });

  test('url-encodes the channel name in the request path', async () => {
    api.get.mockResolvedValue(mockStats);

    await streamElementsService.getChatStats('odd name');

    expect(api.get).toHaveBeenCalledWith('/chatstats/odd%20name/stats');
  });

  test('propagates errors so callers can treat them as "no data"', async () => {
    api.get.mockRejectedValue(new Error('404'));

    await expect(streamElementsService.getChatStats('nobody')).rejects.toThrow(
      '404',
    );
  });
});
