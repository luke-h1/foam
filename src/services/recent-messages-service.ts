import { parseJsonOnWorklet } from '@app/lib/offThreadJson/parseJsonOnWorklet';

const RECENT_MESSAGES_URL =
  'https://recent-messages.robotty.de/api/v2/recent-messages';

type RecentMessagesResponse = {
  messages?: unknown;
  error?: unknown;
  error_code?: unknown;
};

export const recentMessagesService = {
  getRecentMessages: async (
    channelName: string,
    signal?: AbortSignal,
    limit?: number,
  ): Promise<string[]> => {
    const query = limit && limit > 0 ? `?limit=${limit}` : '';
    const response = await fetch(
      `${RECENT_MESSAGES_URL}/${encodeURIComponent(channelName)}${query}`,
      { signal },
    );

    if (!response.ok) {
      throw new Error(`Failed to load recent messages: ${response.status}`);
    }

    const payload = await parseJsonOnWorklet<RecentMessagesResponse>(
      await response.text(),
    );
    if (!Array.isArray(payload.messages)) {
      return [];
    }

    return payload.messages.filter(
      (message): message is string => typeof message === 'string',
    );
  },
} as const;
