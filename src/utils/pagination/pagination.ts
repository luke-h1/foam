import { PaginatedList, TwitchStream } from '@app/services/twitch-service';
import {
  GetNextPageParamFunction,
  GetPreviousPageParamFunction,
} from '@tanstack/react-query';

export const getNextPageParam: GetNextPageParamFunction<
  string,
  PaginatedList<TwitchStream>
> = lastPage => {
  if (!lastPage || !lastPage.pagination) {
    return undefined;
  }
  return lastPage.pagination.cursor || undefined;
};

export const getPreviousPageParam: GetPreviousPageParamFunction<
  string,
  PaginatedList<TwitchStream>
> = firstPage => {
  if (!firstPage || !firstPage.pagination) {
    return undefined;
  }
  return firstPage.pagination.cursor || undefined;
};
