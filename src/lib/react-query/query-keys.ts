import type {
  TwitchClipsRequestParams,
  TwitchVideosRequestParams,
} from '@app/services/twitch-service';

export const twitchKeys = {
  all: ['twitch'] as const,
  stream: (userLogin: string) =>
    [...twitchKeys.all, 'stream', userLogin] as const,
  user: (userId: string) => [...twitchKeys.all, 'user', userId] as const,
  category: (categoryId: string) =>
    [...twitchKeys.all, 'category', categoryId] as const,
  followedStreams: (userId: string) =>
    [...twitchKeys.all, 'followedStreams', userId] as const,
  topStreams: () => [...twitchKeys.all, 'topStreams'] as const,
  topCategories: () => [...twitchKeys.all, 'topCategories'] as const,
  streamsByCategory: (categoryId: string) =>
    [...twitchKeys.all, 'streamsByCategory', categoryId] as const,
  clips: () => [...twitchKeys.all, 'clips'] as const,
  clipsInfinite: (params: Omit<TwitchClipsRequestParams, 'after'>) =>
    [
      ...twitchKeys.clips(),
      params.broadcasterId,
      params.startedAt,
      params.endedAt,
      params.first ?? 20,
    ] as const,
  videos: () => [...twitchKeys.all, 'videos'] as const,
  videosInfinite: (params: Omit<TwitchVideosRequestParams, 'after'>) =>
    [
      ...twitchKeys.videos(),
      params.userId,
      params.type ?? 'archive',
      params.first ?? 20,
    ] as const,
  blockList: (broadcasterId: string) =>
    [...twitchKeys.all, 'blockList', broadcasterId] as const,
};

export const streamElementsKeys = {
  all: ['streamElements'] as const,
  chatStats: (channelName: string) =>
    [...streamElementsKeys.all, 'chatStats', channelName] as const,
};

export const emoteKeys = {
  all: ['emotes'] as const,
  globalEmotes: () => [...emoteKeys.all, 'global'] as const,
  globalBadges: () => [...emoteKeys.all, 'globalBadges'] as const,
};
