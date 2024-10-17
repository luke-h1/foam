import twitchService, {
  Channel,
  Stream,
  Category,
  UserInfoResponse,
  SearchChannelResponse,
} from '@app/services/twitchService';
import { UseQueryOptions } from '@tanstack/react-query';

const twitchQueries = {
  getStream(userLogin: string): UseQueryOptions<Stream> {
    return {
      queryKey: ['stream', userLogin],
      queryFn: () => twitchService.getStream(userLogin),
    };
  },
  getChannel(userId: string): UseQueryOptions<Channel> {
    return {
      queryKey: ['channel', userId],
      queryFn: () => twitchService.getChannel(userId),
    };
  },
  getTopCategories(): UseQueryOptions<Category[]> {
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
  getFollowedStreams(userId: string): UseQueryOptions<Stream[]> {
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
  getTopStreams(cursor?: string): UseQueryOptions<Stream[]> {
    return {
      queryKey: ['topStreams', cursor],
      queryFn: () => twitchService.getTopStreams(cursor),
    };
  },
  getCategory(id: string): UseQueryOptions<Category> {
    return {
      queryKey: ['category', id],
      queryFn: () => twitchService.getCategory(id),
    };
  },
  getStreamsByCategory(id: string, cursor?: string): UseQueryOptions<Stream[]> {
    return {
      queryKey: ['streamsByCategory', id, cursor],
      queryFn: () => twitchService.getStreamsByCategory(id, cursor),
    };
  },
} as const;

export default twitchQueries;
