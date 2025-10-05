import { PaginatedList, TwitchStream } from '@app/services/twitch-service';
import {
  GetNextPageParamFunction,
  GetPreviousPageParamFunction,
} from '@tanstack/react-query';

export const getNextPageParam: GetNextPageParamFunction<
  string,
  PaginatedList<TwitchStream>
> = lastPage => {
  return lastPage.pagination?.cursor ?? '';
};

export const getPreviousPageParam: GetPreviousPageParamFunction<
  string,
  PaginatedList<TwitchStream>
> = firstPage => {
  return firstPage.pagination?.cursor ?? '';
};
