import { useQuery } from '@tanstack/react-query';

import { sevenTvBadgesQueryOptions } from '@app/lib/react-query/queries/emotes';

export function useSevenTvBadgesQuery() {
  return useQuery(sevenTvBadgesQueryOptions());
}
