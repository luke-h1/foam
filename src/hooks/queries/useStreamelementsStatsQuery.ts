import { useQuery } from '@tanstack/react-query';

import { streamElementsChatStatsQueryOptions } from '@app/lib/react-query/queries/streamelements';

interface StreamElementsStatsQueryOptions {
  enabled?: boolean;
}

export function useStreamElementsStatsQuery(
  channelName: string,
  options?: StreamElementsStatsQueryOptions,
) {
  return useQuery({
    ...streamElementsChatStatsQueryOptions(channelName),
    ...options,
  });
}
