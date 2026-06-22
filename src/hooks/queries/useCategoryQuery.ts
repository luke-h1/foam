import { useQuery } from '@tanstack/react-query';

import { categoryQueryOptions } from '@app/lib/react-query/queries/twitch';

export function useCategoryQuery(categoryId: string) {
  return useQuery(categoryQueryOptions(categoryId));
}
