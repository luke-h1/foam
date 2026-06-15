import { videosInfiniteQueryOptions } from '@app/lib/react-query/queries/twitch';
import type { TwitchVideosRequestParams } from '@app/services/twitch-service';
import { useInfiniteQuery } from '@tanstack/react-query';

interface VideosQueryOptions {
  enabled?: boolean;
}

export function useVideosQuery(
  params: Omit<TwitchVideosRequestParams, 'after'>,
  options?: VideosQueryOptions,
) {
  return useInfiniteQuery({
    ...videosInfiniteQueryOptions(params),
    ...options,
  });
}
