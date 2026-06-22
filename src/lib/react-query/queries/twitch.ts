import { infiniteQueryOptions, queryOptions } from '@tanstack/react-query';

import {
  Category,
  PaginatedList,
  TwitchClipsRequestParams,
  twitchService,
  TwitchStream,
  TwitchVideosRequestParams,
  UserBlockList,
  UserInfoResponse,
} from '@app/services/twitch-service';
import {
  getNextPageParam,
  getPreviousPageParam,
} from '@app/utils/pagination/pagination';

import { twitchKeys } from '../query-keys';

const MAX_INFINITE_PAGES = 15;

export function streamQueryOptions(userLogin: string) {
  return queryOptions({
    queryKey: twitchKeys.stream(userLogin),
    staleTime: 30_000,
    queryFn: () => twitchService.getStream(userLogin) as Promise<TwitchStream>,
  });
}

export function userQueryOptions(userId: string) {
  return queryOptions<UserInfoResponse>({
    queryKey: twitchKeys.user(userId),
    staleTime: 300_000,
    queryFn: () => twitchService.getUser(userId),
  });
}

export function categoryQueryOptions(categoryId: string) {
  return queryOptions<Category>({
    queryKey: twitchKeys.category(categoryId),
    staleTime: 60_000,
    queryFn: () => twitchService.getCategory(categoryId),
  });
}

export function followedStreamsQueryOptions(userId: string) {
  return queryOptions<TwitchStream[]>({
    queryKey: twitchKeys.followedStreams(userId),
    staleTime: 30_000,
    queryFn: () => twitchService.getFollowedStreams(userId),
  });
}

export function topStreamsInfiniteQueryOptions() {
  return infiniteQueryOptions({
    queryKey: twitchKeys.topStreams(),
    staleTime: 60_000,
    queryFn: ({ pageParam }) => twitchService.getTopStreams(pageParam),
    initialPageParam: undefined as string | undefined,
    maxPages: MAX_INFINITE_PAGES,
    getNextPageParam,
    getPreviousPageParam,
  });
}

export function topCategoriesInfiniteQueryOptions() {
  return infiniteQueryOptions({
    queryKey: twitchKeys.topCategories(),
    staleTime: 60_000,
    queryFn: ({ pageParam }) => twitchService.getTopCategories(pageParam),
    initialPageParam: undefined as string | undefined,
    maxPages: MAX_INFINITE_PAGES,
    getNextPageParam: (lastPage: PaginatedList<Category>) =>
      lastPage?.pagination?.cursor,
    getPreviousPageParam: () => undefined,
  });
}

export function streamsByCategoryInfiniteQueryOptions(categoryId: string) {
  return infiniteQueryOptions({
    queryKey: twitchKeys.streamsByCategory(categoryId),
    staleTime: 60_000,
    queryFn: ({ pageParam }) =>
      twitchService.getStreamsByCategory(categoryId, pageParam),
    initialPageParam: undefined as string | undefined,
    maxPages: MAX_INFINITE_PAGES,
    getNextPageParam,
    getPreviousPageParam,
  });
}

export function clipsInfiniteQueryOptions(
  params: Omit<TwitchClipsRequestParams, 'after'>,
) {
  return infiniteQueryOptions({
    queryKey: twitchKeys.clipsInfinite(params),
    staleTime: 60_000,
    queryFn: ({ pageParam }) =>
      twitchService.getClips({ ...params, after: pageParam }),
    initialPageParam: undefined as string | undefined,
    maxPages: MAX_INFINITE_PAGES,
    getNextPageParam: lastPage => lastPage?.pagination?.cursor || undefined,
  });
}

export function videosInfiniteQueryOptions(
  params: Omit<TwitchVideosRequestParams, 'after'>,
) {
  return infiniteQueryOptions({
    queryKey: twitchKeys.videosInfinite(params),
    staleTime: 60_000,
    queryFn: ({ pageParam }) =>
      twitchService.getVideos({ ...params, after: pageParam }),
    initialPageParam: undefined as string | undefined,
    maxPages: MAX_INFINITE_PAGES,
    getNextPageParam: lastPage => lastPage?.pagination?.cursor || undefined,
  });
}

export function userBlockListQueryOptions(broadcasterId: string) {
  return queryOptions<PaginatedList<UserBlockList>>({
    queryKey: twitchKeys.blockList(broadcasterId),
    staleTime: 60_000,
    queryFn: () => twitchService.getUserBlockList({ broadcasterId }),
  });
}
