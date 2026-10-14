import { queryOptions } from '@tanstack/react-query';

import { streamElementsService } from '@app/services/streamelements-service';
import type { StreamElementsChatStats } from '@app/types/streamelements/stats';

import { streamElementsKeys } from '../query-keys';

export function streamElementsChatStatsQueryOptions(channelName: string) {
  return queryOptions<StreamElementsChatStats>({
    queryKey: streamElementsKeys.chatStats(channelName),
    // Aggregate stats barely move, and most channels have no StreamElements
    // account, so a miss is a 404. Cache for an hour and do not retry.
    staleTime: 60 * 60 * 1000,
    retry: false,
    queryFn: () => streamElementsService.getChatStats(channelName),
  });
}
