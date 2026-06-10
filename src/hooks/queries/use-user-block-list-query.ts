import { userBlockListQueryOptions } from '@app/lib/react-query/queries/twitch';
import { useQuery } from '@tanstack/react-query';

interface UserBlockListQueryOptions {
  enabled?: boolean;
}

export function useUserBlockListQuery(
  broadcasterId: string,
  options?: UserBlockListQueryOptions,
) {
  return useQuery({
    ...userBlockListQueryOptions(broadcasterId),
    ...options,
  });
}
