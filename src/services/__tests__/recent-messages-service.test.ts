import type { FetchResponse } from 'expo/build/winter/fetch/FetchResponse';
import { fetch } from 'expo/fetch';

import { recentMessagesService } from '@app/services/recent-messages-service';
import { logger } from '@app/utils/logger';

const mockWarn = jest.spyOn(logger.chat, 'warn').mockImplementation(() => {});

interface RecentMessagesBody {
  messages: (string | number)[];
  error: string | null;
  error_code?: string;
}

const mockFetch = jest.mocked(fetch);

function respondWith(body: RecentMessagesBody) {
  // SAFETY: the API client only reads .status and .text() off the response.
  mockFetch.mockResolvedValue({
    ok: true,
    status: 200,
    text: () => Promise.resolve(JSON.stringify(body)),
  } as FetchResponse);
}

describe('recentMessagesService.getRecentMessages', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('returns the string lines of a successful payload', async () => {
    respondWith({ messages: ['line-1', 42, 'line-2'], error: null });

    await expect(
      recentMessagesService.getRecentMessages('foam'),
    ).resolves.toEqual(['line-1', 'line-2']);

    expect(mockWarn).not.toHaveBeenCalled();
  });

  test('requests the channel with the limit through the API client', async () => {
    respondWith({ messages: [], error: null });

    await recentMessagesService.getRecentMessages('foam', undefined, 50);

    expect(mockFetch.mock.calls[0]?.[0]).toBe(
      'https://recent-messages.robotty.de/api/v2/recent-messages/foam?limit=50',
    );
  });

  test('warns and returns no lines when the payload carries an error', async () => {
    respondWith({
      messages: [],
      error: 'The channel has been ignored',
      error_code: 'channel_ignored',
    });

    await expect(
      recentMessagesService.getRecentMessages('foam'),
    ).resolves.toEqual([]);

    expect(mockWarn.mock.calls).toEqual([
      [
        'Recent messages service returned an error',
        {
          name: 'recent_messages_warning',
          action: 'recent_messages_error',
          channel_name: 'foam',
          error_code: 'channel_ignored',
          reason: 'The channel has been ignored',
        },
      ],
    ]);
  });
});
