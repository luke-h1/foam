import { useQuery } from '@tanstack/react-query';

import { streamQueryOptions } from '@app/lib/react-query/queries/twitch';

interface StreamQueryOptions {
  enabled?: boolean;
}

export function useStreamQuery(
  userLogin: string,
  options?: StreamQueryOptions,
) {
  return useQuery({
    ...streamQueryOptions(userLogin),
    ...options,
  });
}
