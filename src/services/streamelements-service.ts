import type { StreamElementsChatStats } from '@app/types/streamelements/stats';

import { ApiError } from './api/client';
import { isStreamElementsNoData, streamElementsApi } from './api/clients';

export const streamElementsService = {
  /**
   * StreamElements 404s for a channel that does not use it. That resolves to
   * `null` ("no data"); any other failure rejects.
   */
  getChatStats: async (
    channelName: string,
  ): Promise<StreamElementsChatStats | null> => {
    try {
      return await streamElementsApi.get<StreamElementsChatStats>(
        `/chatstats/${encodeURIComponent(channelName)}/stats`,
      );
    } catch (error) {
      if (error instanceof ApiError && isStreamElementsNoData(error.status)) {
        return null;
      }

      throw error;
    }
  },
} as const;
