import type { TwitchClipsRequestParams } from '@app/services/twitch-service';

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
    ] as const,
  blockList: (broadcasterId: string) =>
    [...twitchKeys.all, 'blockList', broadcasterId] as const,
};
