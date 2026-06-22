import { useQuery } from '@tanstack/react-query';

import { userQueryOptions } from '@app/lib/react-query/queries/twitch';

interface UserQueryOptions {
  enabled?: boolean;
}

export function useUserQuery(userId: string, options?: UserQueryOptions) {
  return useQuery({
    ...userQueryOptions(userId),
    ...options,
  });
}
