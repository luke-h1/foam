import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import Animated, {
  SharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import type { ListRenderItem } from '@shopify/flash-list';

import { AnimatedFlashList } from '@app/components/FlashList/AnimatedFlashList';
import { FlashListRef } from '@app/components/FlashList/FlashList';
import { MemoizedLiveStreamCard } from '@app/components/LiveStreamCard/LiveStreamCard';
import { LiveStreamCardSkeleton } from '@app/components/LiveStreamCard/LiveStreamCardSkeleton';
import { StreamListLayoutToggle } from '@app/components/StreamListLayoutToggle/StreamListLayoutToggle';
import { EmptyState } from '@app/components/ui/EmptyState/EmptyState';
import { useTopStreamsQuery } from '@app/hooks/queries/useTopStreamsQuery';
import { useDebouncedCallback } from '@app/hooks/useDebouncedCallback';
import { useInfiniteQueryLoadMore } from '@app/hooks/useInfiniteQueryLoadMore';
import { useRefetchOnForeground } from '@app/hooks/useRefetchOnForeground';
import { useScrollToTop } from '@app/hooks/useScrollToTop';
import {
  type Preferences,
  usePreference,
  useUpdatePreferences,
} from '@app/store/preferenceStore';
import { motion } from '@app/styles/motion';
import { theme } from '@app/styles/themes';
import type { TwitchStream } from '@app/types/twitch/stream';
import { flattenInfiniteQueryPages } from '@app/utils/pagination/flattenInfiniteQueryPages';

type StreamListLayout = Preferences['streamListLayout'];

interface TopStreamsListHeaderProps {
  streamListLayout: StreamListLayout;
  onChangeLayout: (layout: StreamListLayout) => void;
}

const TopStreamsListHeader = function TopStreamsListHeader({
  streamListLayout,
  onChangeLayout,
}: TopStreamsListHeaderProps) {
  return (
    <View style={styles.layoutToggleRow}>
      <StreamListLayoutToggle
        value={streamListLayout}
        onChange={onChangeLayout}
      />
    </View>
  );
};

interface TopStreamsScreenProps {
  contentTopInset?: number;
  scrollY?: SharedValue<number>;
}

export function TopStreamsScreen({
  contentTopInset = 0,
  scrollY,
}: TopStreamsScreenProps = {}) {
  const { t } = useTranslation('stream');
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const streamListLayout = usePreference('streamListLayout');
  const updatePreferences = useUpdatePreferences();
  const listRef = useRef<FlashListRef<TwitchStream>>(null);

  useScrollToTop(listRef);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: event => {
      if (scrollY) {
        scrollY.set(event.contentOffset.y);
      }
    },
  });

  const {
    data: streams,
    fetchNextPage,
    refetch,
    hasNextPage,
    isLoading,
    isFetching,
    isFetchingNextPage,
  } = useTopStreamsQuery();

  useRefetchOnForeground({
    refetch,
  });

  const handleLoadMore = useInfiniteQueryLoadMore({
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  });

  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  const [debouncedHandleLoadMore] = useDebouncedCallback(handleLoadMore, 150);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const renderItem: ListRenderItem<TwitchStream> = ({ item }) => {
    return <MemoizedLiveStreamCard stream={item} layout={streamListLayout} />;
  };

  const allStreams = flattenInfiniteQueryPages(streams?.pages);

  const handleLayoutChange = (layout: StreamListLayout) => {
    if (layout === streamListLayout) {
      return;
    }
    updatePreferences({ streamListLayout: layout });
  };

  const listHeader = (
    <TopStreamsListHeader
      streamListLayout={streamListLayout}
      onChangeLayout={handleLayoutChange}
    />
  );

  const showSkeleton =
    refreshing || isLoading || (isFetching && allStreams.length === 0);

  if (showSkeleton) {
    return (
      <View style={[styles.container, { paddingTop: contentTopInset }]}>
        {Array.from({ length: 5 }).map((_, index) => (
          // eslint-disable-next-line react/no-array-index-key
          <LiveStreamCardSkeleton key={index} layout={streamListLayout} />
        ))}
      </View>
    );
  }

  if (!streams || !streams.pages) {
    return (
      <View style={styles.container}>
        {/* eslint-disable-next-line @typescript-eslint/no-misused-promises */}
        <EmptyState
          content={t('noTopStreamsFound')}
          buttonOnPress={onRefresh}
        />
      </View>
    );
  }

  if (allStreams.length === 0) {
    return (
      <View style={styles.container}>
        {/* eslint-disable-next-line @typescript-eslint/no-misused-promises */}
        <EmptyState
          content={t('noTopStreamsFound')}
          buttonOnPress={onRefresh}
        />
      </View>
    );
  }

  return (
    <TopStreamsList
      contentTopInset={contentTopInset}
      debouncedHandleLoadMore={debouncedHandleLoadMore}
      listHeader={listHeader}
      listRef={listRef}
      onRefresh={onRefresh}
      refreshing={refreshing}
      remainingStreams={allStreams}
      renderItem={renderItem}
      scrollHandler={scrollHandler}
      streamListLayout={streamListLayout}
    />
  );
}

function TopStreamsList({
  contentTopInset,
  debouncedHandleLoadMore,
  listHeader,
  listRef,
  onRefresh,
  refreshing,
  remainingStreams,
  renderItem,
  scrollHandler,
  streamListLayout,
}: {
  contentTopInset: number;
  debouncedHandleLoadMore: () => void;
  listHeader: React.ReactElement;
  listRef: React.RefObject<FlashListRef<TwitchStream> | null>;
  onRefresh: () => void;
  refreshing: boolean;
  remainingStreams: TwitchStream[];
  renderItem: ListRenderItem<TwitchStream>;
  scrollHandler: ReturnType<typeof useAnimatedScrollHandler>;
  streamListLayout: StreamListLayout;
}) {
  const listFadeStyle = useLayoutSwitchFade(streamListLayout);

  return (
    <Animated.View
      testID='top-streams-list'
      style={[styles.container, listFadeStyle]}
    >
      <AnimatedFlashList
        ref={listRef}
        contentInsetAdjustmentBehavior='automatic'
        data={remainingStreams}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        getItemType={() => 'stream-item'}
        drawDistance={500}
        contentContainerStyle={[
          styles.listContent,
          { paddingTop: contentTopInset },
        ]}
        ListHeaderComponent={listHeader}
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        onEndReached={debouncedHandleLoadMore}
        onScroll={scrollHandler}
        refreshing={refreshing}
        onEndReachedThreshold={0.3}
        onRefresh={onRefresh}
      />
    </Animated.View>
  );
}

/**
 * Soft dip-and-recover fade when the user switches list layouts, so the
 * rows do not hard-cut between shapes. No remount; scroll is preserved.
 */
function useLayoutSwitchFade(streamListLayout: StreamListLayout) {
  const fade = useSharedValue(1);

  useEffect(() => {
    fade.set(0.35);
    fade.set(
      withTiming(1, { duration: motion.medium, easing: motion.easing.out }),
    );
  }, [fade, streamListLayout]);

  return useAnimatedStyle(() => ({ opacity: fade.get() }));
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.color.background.dark,
    flex: 1,
  },
  listContent: {
    paddingBottom: theme.space20,
  },
  layoutToggleRow: {
    alignItems: 'flex-end',
    marginBottom: theme.space8,
    marginHorizontal: theme.space16,
    marginTop: theme.space8,
  },
});
