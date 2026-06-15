import { streamElementsChatStatsQueryOptions } from '@app/lib/react-query/queries/streamelements';
import { useQuery } from '@tanstack/react-query';

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
