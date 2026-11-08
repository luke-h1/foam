import { logger } from '@app/utils/logger';

import { createApiClient } from './api/client';

const recentMessagesApi = createApiClient({
  baseURL: 'https://recent-messages.robotty.de/api/v2',
});

interface RecentMessagesResponse {
  messages?: string[];
  error?: string | null;
  error_code?: string | null;
}

export const recentMessagesService = {
  getRecentMessages: async (
    channelName: string,
    signal?: AbortSignal,
    limit?: number,
  ): Promise<string[]> => {
    const payload = await recentMessagesApi.get<RecentMessagesResponse>(
      `/recent-messages/${encodeURIComponent(channelName)}`,
      { params: { limit: limit && limit > 0 ? limit : undefined }, signal },
    );

    if (payload.error) {
      logger.chat.warn('Recent messages service returned an error', {
        name: 'recent_messages_warning',
        action: 'recent_messages_error',
        channel_name: channelName,
        error_code: payload.error_code ?? undefined,
        reason: payload.error,
      });

      return [];
    }

    if (!Array.isArray(payload.messages)) {
      return [];
    }

    return payload.messages.filter(message => String(message) === message);
  },
} as const;
