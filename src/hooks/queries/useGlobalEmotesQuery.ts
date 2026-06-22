import { useQuery } from '@tanstack/react-query';

import { globalEmotesQueryOptions } from '@app/lib/react-query/queries/emotes';

export function useGlobalEmotesQuery() {
  return useQuery(globalEmotesQueryOptions());
}
