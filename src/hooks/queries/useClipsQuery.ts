import { useInfiniteQuery } from '@tanstack/react-query';

import { clipsInfiniteQueryOptions } from '@app/lib/react-query/queries/twitch';
import type { TwitchClipsRequestParams } from '@app/types/twitch/clip';

interface ClipsQueryOptions {
  enabled?: boolean;
}

export function useClipsQuery(
  params: Omit<TwitchClipsRequestParams, 'after'>,
  options?: ClipsQueryOptions,
) {
  return useInfiniteQuery({
    ...clipsInfiniteQueryOptions(params),
    ...options,
  });
}
