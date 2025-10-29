import {
  twitchService,
  Channel,
  TwitchStream,
  Category,
  UserInfoResponse,
  SearchChannelResponse,
  PaginatedList,
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
  searchChannels(query: string): UseQueryOptions<SearchChannelResponse[]> {
    return {
      queryKey: ['searchChannels', query],
      queryFn: () => twitchService.searchChannels(query),
    };
  },
  getTopStreams(cursor?: string): UseQueryOptions<PaginatedList<TwitchStream>> {
    return {
      queryKey: ['topStreams', cursor],
      queryFn: () => twitchService.getTopStreams(cursor),
    };
  },
  getTopStreamsInfinite(): {
    queryKey: string[];
    queryFn: ({
      pageParam,
    }: {
      pageParam?: string;
    }) => Promise<PaginatedList<TwitchStream>>;
  } {
    return {
      queryKey: ['topStreamsInfinite'],
      queryFn: ({ pageParam }: { pageParam?: string }) =>
        twitchService.getTopStreams(pageParam),
    };
  },
  getCategory(id: string): UseQueryOptions<Category> {
    return {
      queryKey: ['category', id],
      queryFn: () => twitchService.getCategory(id),
    };
  },
  getStreamsByCategory(
    id: string,
    cursor?: string,
  ): UseQueryOptions<PaginatedList<TwitchStream>> {
    return {
      queryKey: ['streamsByCategory', id, cursor],
      queryFn: () => twitchService.getStreamsByCategory(id, cursor),
    };
  },
} as const;
