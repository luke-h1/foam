import { categoryQueryOptions } from '@app/lib/react-query/queries/twitch';
import { useQuery } from '@tanstack/react-query';

export function useCategoryQuery(categoryId: string) {
  return useQuery(categoryQueryOptions(categoryId));
}
