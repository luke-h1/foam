import { logger } from '@app/utils/logger';
import { streamElementsApi } from './api/clients';

export interface StreamElementsEmoteStat {
  id: string;
  emote: string;
  amount: number;
}

export interface StreamElementsChatterStat {
  name: string;
  amount: number;
}

/**
 * Public chat statistics for a Twitch channel that uses StreamElements.
 * @see https://api.streamelements.com/kappa/v2/chatstats/:channel/stats
 */
export interface StreamElementsChatStats {
  channel: string;
  totalMessages: number;
  uniqueChatters: number;
  chatters: StreamElementsChatterStat[];
  twitchEmotes: StreamElementsEmoteStat[];
  bttvEmotes: StreamElementsEmoteStat[];
  ffzEmotes: StreamElementsEmoteStat[];
  sevenTVEmotes: StreamElementsEmoteStat[];
}

export const streamElementsService = {
  /**
   * Returns aggregate chat stats for a channel. StreamElements responds with a
   * 404 for channels that do not use StreamElements, so callers should treat a
   * rejected promise as "no data available" rather than a hard error.
   */
  getChatStats: async (
    channelName: string,
  ): Promise<StreamElementsChatStats> => {
    try {
      return await streamElementsApi.get<StreamElementsChatStats>(
        `/chatstats/${encodeURIComponent(channelName)}/stats`,
      );
    } catch (error) {
      logger.streamElements.info(
        `No StreamElements chat stats for ${channelName}`,
        error,
      );
      throw error;
    }
  },
} as const;
