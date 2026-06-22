import { useQuery } from '@tanstack/react-query';

import { userBlockListQueryOptions } from '@app/lib/react-query/queries/twitch';

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
