import { useMemo } from 'react';

import { useInfiniteQuery } from '@tanstack/react-query';

import { useFlattenedInfiniteQuery } from '@app/hooks/use-flattened-infinite-query';
import { useInfiniteQueryLoadMore } from '@app/hooks/use-infinite-query-load-more';
import {
  clipsInfiniteQueryOptions,
  videosInfiniteQueryOptions,
} from '@app/lib/react-query/queries/twitch';

import type { ProfileListItem, ProfileTab } from '../types';

/**
 * Runs the clips and VODs queries side by side and hands back whichever tab is
 * showing, so the screen reads one list rather than choosing between two at
 * every use.
 */
export function useStreamerProfileTab({
  activeTab,
  broadcasterId,
}: {
  activeTab: ProfileTab;
  broadcasterId: string;
}) {
  const enabled = Boolean(broadcasterId);

  const clipsQuery = useInfiniteQuery({
    ...clipsInfiniteQueryOptions({ broadcasterId, first: 20 }),
    enabled,
  });

  const videosQuery = useInfiniteQuery({
    ...videosInfiniteQueryOptions({ userId: broadcasterId, first: 20 }),
    enabled,
  });

  const clips = useFlattenedInfiniteQuery(clipsQuery.data?.pages);
  const vods = useFlattenedInfiniteQuery(videosQuery.data?.pages);

  const handleLoadMoreClips = useInfiniteQueryLoadMore({
    fetchNextPage: clipsQuery.fetchNextPage,
    hasNextPage: clipsQuery.hasNextPage,
    isFetchingNextPage: clipsQuery.isFetchingNextPage,
  });

  const handleLoadMoreVods = useInfiniteQueryLoadMore({
    fetchNextPage: videosQuery.fetchNextPage,
    hasNextPage: videosQuery.hasNextPage,
    isFetchingNextPage: videosQuery.isFetchingNextPage,
  });

  const isVods = activeTab === 'vods';

  const items = useMemo(
    (): ProfileListItem[] =>
      isVods
        ? vods.map(vod => ({ kind: 'vod' as const, vod }))
        : clips.map(clip => ({ kind: 'clip' as const, clip })),
    [clips, isVods, vods],
  );

  return {
    handleLoadMore: isVods ? handleLoadMoreVods : handleLoadMoreClips,
    isTabError: isVods ? videosQuery.isError : clipsQuery.isError,
    isTabLoading: isVods ? videosQuery.isLoading : clipsQuery.isLoading,
    items,
    refetchTab: isVods ? videosQuery.refetch : clipsQuery.refetch,
  };
}
