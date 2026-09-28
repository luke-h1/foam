import { GetNextPageParamFunction } from '@tanstack/react-query';

import type { PaginatedList } from '@app/types/twitch/api';
import type { TwitchStream } from '@app/types/twitch/stream';

export const getNextPageParam: GetNextPageParamFunction<
  string | undefined,
  PaginatedList<TwitchStream>
> = lastPage => {
  if (!lastPage.pagination) {
    return undefined;
  }
  return lastPage.pagination.cursor || undefined;
};
