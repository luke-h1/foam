import { queryOptions } from '@tanstack/react-query';

import { streamElementsService } from '@app/services/streamelements-service';
import type { StreamElementsChatStats } from '@app/types/streamelements/stats';

import { streamElementsKeys } from '../queryKeys';

export function streamElementsChatStatsQueryOptions(channelName: string) {
  return queryOptions<StreamElementsChatStats | null>({
    queryKey: streamElementsKeys.chatStats(channelName),
    staleTime: 60 * 60 * 1000,
    retry: false,
    queryFn: () => streamElementsService.getChatStats(channelName),
  });
}
