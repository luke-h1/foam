import { useQuery } from '@tanstack/react-query';

import { globalBadgesQueryOptions } from '@app/lib/react-query/queries/emotes';

export function useGlobalBadgesQuery() {
  return useQuery(globalBadgesQueryOptions());
}
