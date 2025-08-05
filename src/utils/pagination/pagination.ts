import { PaginatedList, Stream } from '@app/services';
import {
  GetNextPageParamFunction,
  GetPreviousPageParamFunction,
} from '@tanstack/react-query';

export const getNextPageParam: GetNextPageParamFunction<
  string,
  PaginatedList<Stream>
> = lastPage => {
  return lastPage.pagination?.cursor ?? '';
};

export const getPreviousPageParam: GetPreviousPageParamFunction<
  string,
  PaginatedList<Stream>
> = firstPage => {
  return firstPage.pagination?.cursor ?? '';
};
