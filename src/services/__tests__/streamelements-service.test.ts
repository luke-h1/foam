import type { StreamElementsChatStats } from '@app/types/streamelements/stats';

import { streamElementsApi } from '../api/clients';
import { streamElementsService } from '../streamelements-service';

const api = { get: jest.spyOn(streamElementsApi, 'get') };

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

  test('url-encodes the channel name in the request path', async () => {
    api.get.mockResolvedValue(mockStats);

    const result = await streamElementsService.getChatStats('odd name');

    expect(api.get).toHaveBeenCalledWith('/chatstats/odd%20name/stats');
    expect(result).toEqual<StreamElementsChatStats>(mockStats);
  });

  test('propagates errors so callers can treat them as "no data"', async () => {
    api.get.mockRejectedValue(new Error('404'));

    await expect(streamElementsService.getChatStats('nobody')).rejects.toThrow(
      '404',
    );
  });
});
