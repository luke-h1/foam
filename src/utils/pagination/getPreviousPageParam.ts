import { GetPreviousPageParamFunction } from '@tanstack/react-query';

import type { PaginatedList } from '@app/types/twitch/api';
import type { TwitchStream } from '@app/types/twitch/stream';

export const getPreviousPageParam: GetPreviousPageParamFunction<
  string | undefined,
  PaginatedList<TwitchStream>
> = firstPage => {
  if (!firstPage || !firstPage.pagination) {
    return undefined;
  }
  return firstPage.pagination.cursor || undefined;
};
