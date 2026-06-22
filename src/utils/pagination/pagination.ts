import {
  GetNextPageParamFunction,
  GetPreviousPageParamFunction,
} from '@tanstack/react-query';

import { PaginatedList, TwitchStream } from '@app/services/twitch-service';

export const getNextPageParam: GetNextPageParamFunction<
  string | undefined,
  PaginatedList<TwitchStream>
> = lastPage => {
  if (!lastPage || !lastPage.pagination) {
    return undefined;
  }
  return lastPage.pagination.cursor || undefined;
};

export const getPreviousPageParam: GetPreviousPageParamFunction<
  string | undefined,
  PaginatedList<TwitchStream>
> = firstPage => {
  if (!firstPage || !firstPage.pagination) {
    return undefined;
  }
  return firstPage.pagination.cursor || undefined;
};
