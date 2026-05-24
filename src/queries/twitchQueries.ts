import {
  twitchService,
  Channel,
  TwitchStream,
  Category,
  UserInfoResponse,
  SearchChannelResponse,
  PaginatedList,
  UserBlockListRequestParams,
  UserBlockList,
  TwitchClip,
  TwitchClipsRequestParams,
} from '@app/services/twitch-service';
import { UseQueryOptions } from '@tanstack/react-query';

export const twitchQueries = {
  getStream(userLogin: string): UseQueryOptions<TwitchStream> {
    return {
      queryKey: ['stream', userLogin],
      queryFn: () =>
        twitchService.getStream(userLogin) as Promise<TwitchStream>,
    };
  },
  getChannel(userId: string): UseQueryOptions<Channel> {
    return {
      queryKey: ['channel', userId],
      queryFn: () => twitchService.getChannel(userId),
    };
  },
  getTopCategories(): UseQueryOptions<PaginatedList<Category>> {
    return {
      queryKey: ['topCategories'],
      queryFn: () => twitchService.getTopCategories(),
    };
  },
  getUserImage(userId: string): UseQueryOptions<string> {
    return {
      queryKey: ['userImage', userId],
      queryFn: () => twitchService.getUserImage(userId),
    };
  },
  getFollowedStreams(userId: string): UseQueryOptions<TwitchStream[]> {
    return {
      queryKey: ['followedStreams', userId],
      queryFn: () => twitchService.getFollowedStreams(userId),
    };
  },
  getUserInfo(token: string): UseQueryOptions<UserInfoResponse> {
    return {
      queryKey: ['userInfo'],
      queryFn: () => twitchService.getUserInfo(token),
    };
  },
  getUser(userId: string): UseQueryOptions<UserInfoResponse> {
    return {
      queryKey: ['user', userId],
      queryFn: () => twitchService.getUser(userId),
    };
  },
  getClips(
    params: TwitchClipsRequestParams,
  ): UseQueryOptions<PaginatedList<TwitchClip>> {
    return {
      queryKey: [
        'clips',
        params.broadcasterId,
        params.startedAt,
        params.endedAt,
      ],
      queryFn: () => twitchService.getClips(params),
    };
  },
  getClipsInfinite(params: Omit<TwitchClipsRequestParams, 'after'>): {
    queryKey: (string | undefined)[];
    staleTime: number;
    queryFn: ({
      pageParam,
    }: {
      pageParam?: string;
    }) => Promise<PaginatedList<TwitchClip>>;
  } {
    return {
      queryKey: [
        'clipsInfinite',
        params.broadcasterId,
        params.startedAt,
        params.endedAt,
      ],
      staleTime: 60_000,
      queryFn: ({ pageParam }: { pageParam?: string }) =>
        twitchService.getClips({ ...params, after: pageParam }),
    };
  },
  getTopStreamsInfinite(): {
    queryKey: string[];
    staleTime: number;
    queryFn: ({
      pageParam,
    }: {
      pageParam?: string;
    }) => Promise<PaginatedList<TwitchStream>>;
  } {
    return {
      queryKey: ['topStreamsInfinite'],
      staleTime: 60_000,
      queryFn: async ({ pageParam }: { pageParam?: string }) => {
        return twitchService.getTopStreams(pageParam);
      },
    };
  },
  searchChannels(query: string): UseQueryOptions<SearchChannelResponse[]> {
    return {
      queryKey: ['searchChannels', query],
      queryFn: () => twitchService.searchChannels(query),
    };
  },
  getTopStreams(): {
    queryKey: string[];
    queryFn: ({
      pageParam,
    }: {
      pageParam?: string;
    }) => Promise<PaginatedList<TwitchStream>>;
  } {
    return {
      queryKey: ['topStreams'],
      queryFn: ({ pageParam }: { pageParam?: string }) =>
        twitchService.getTopStreams(pageParam),
    };
  },
  getCategory(id: string): UseQueryOptions<Category> {
    return {
      queryKey: ['category', id],
      staleTime: 60_000,
      queryFn: () => twitchService.getCategory(id),
    };
  },
  getUserBlockList: (
    params: UserBlockListRequestParams,
  ): UseQueryOptions<PaginatedList<UserBlockList>> => {
    return {
      queryKey: ['blockList', params.broadcasterId],
      queryFn: () => twitchService.getUserBlockList(params),
    };
  },
  getStreamsByCategory(id: string): {
    queryKey: string[];
    staleTime: number;
    queryFn: ({
      pageParam,
    }: {
      pageParam?: string;
    }) => Promise<PaginatedList<TwitchStream>>;
  } {
    return {
      queryKey: ['streamsByCategory', id],
      staleTime: 60_000,
      queryFn: ({ pageParam }: { pageParam?: string }) =>
        twitchService.getStreamsByCategory(id, pageParam),
    };
  },
} as const;
