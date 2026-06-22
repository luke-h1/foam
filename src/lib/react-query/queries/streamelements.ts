import { queryOptions } from '@tanstack/react-query';

import { streamElementsService } from '@app/services/streamelements-service';
import type { StreamElementsChatStats } from '@app/types/streamelements/stats';

import { streamElementsKeys } from '../query-keys';

export function streamElementsChatStatsQueryOptions(channelName: string) {
  return queryOptions<StreamElementsChatStats>({
    queryKey: streamElementsKeys.chatStats(channelName),
    // Aggregate stats barely move and a miss is a 404, so cache hard and skip
    // retries — most channels simply do not have a StreamElements account.
    staleTime: 60 * 60 * 1000,
    retry: false,
    queryFn: () => streamElementsService.getChatStats(channelName),
  });
}
