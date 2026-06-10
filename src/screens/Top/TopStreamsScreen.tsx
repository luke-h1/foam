import { Button } from '@app/components/Button/Button';
import { EmptyState } from '@app/components/ui/EmptyState/EmptyState';
import { AnimatedFlashList } from '@app/components/FlashList/AnimatedFlashList';
import { FlashListRef } from '@app/components/FlashList/FlashList';
import { MemoizedLiveStreamCard } from '@app/components/LiveStreamCard/LiveStreamCard';
import { LiveStreamCardSkeleton } from '@app/components/LiveStreamCard/LiveStreamCardSkeleton';
import { Text } from '@app/components/ui/Text/Text';
import { useDebouncedCallback } from '@app/hooks/useDebouncedCallback';
import { useInfiniteQueryLoadMore } from '@app/hooks/useInfiniteQueryLoadMore';
import { useRefetchOnForeground } from '@app/hooks/useRefetchOnForeground';
import { useScrollToTop } from '@app/hooks/useScrollToTop';
import { useTopStreamsQuery } from '@app/hooks/queries/use-top-streams-query';
import { TwitchStream } from '@app/services/twitch-service';
import {
  type Preferences,
  usePreference,
  useUpdatePreferences,
} from '@app/store/preferenceStore';
import { theme } from '@app/styles/themes';
import { flattenInfiniteQueryPages } from '@app/utils/pagination/flattenInfiniteQueryPages';
import type { ListRenderItem } from '@shopify/flash-list';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { useRef, useState, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { SharedValue, useAnimatedScrollHandler } from 'react-native-reanimated';

type StreamListLayout = Preferences['streamListLayout'];

const STREAM_LIST_LAYOUT_OPTIONS: {
  icon: SymbolViewProps['name'];
  label: string;
  value: StreamListLayout;
}[] = [
  { icon: 'square', label: 'Compact', value: 'compact' },
  { icon: 'photo', label: 'Media', value: 'media' },
];

const StreamLayoutToggle = function StreamLayoutToggle({
  value,
  onChange,
}: {
  value: StreamListLayout;
  onChange: (value: StreamListLayout) => void;
}) {
  return (
    <View style={styles.layoutToggleRow}>
      {STREAM_LIST_LAYOUT_OPTIONS.map(option => {
        const active = value === option.value;

        return (
          <Button
            key={option.value}
            onPress={() => onChange(option.value)}
            style={[
              styles.layoutToggleButton,
              active && styles.layoutToggleButtonActive,
            ]}
          >
            <SymbolView
              name={option.icon}
              size={14}
              tintColor={
                active ? theme.color.text.dark : theme.color.textSecondary.dark
              }
            />
            <Text
              type='xxs'
              weight='semibold'
              style={[
                styles.layoutToggleText,
                active && styles.layoutToggleTextActive,
              ]}
            >
              {option.label}
            </Text>
          </Button>
        );
      })}
    </View>
  );
};

interface TopStreamsListHeaderProps {
  streamListLayout: StreamListLayout;
  onChangeLayout: (layout: StreamListLayout) => void;
}

const TopStreamsListHeader = function TopStreamsListHeader({
  streamListLayout,
  onChangeLayout,
}: TopStreamsListHeaderProps) {
  return (
    <StreamLayoutToggle value={streamListLayout} onChange={onChangeLayout} />
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
        <EmptyState content='No Top Streams found' buttonOnPress={onRefresh} />
      </View>
    );
  }

  if (allStreams.length === 0) {
    return (
      <View style={styles.container}>
        {/* eslint-disable-next-line @typescript-eslint/no-misused-promises */}
        <EmptyState content='No Top Streams found' buttonOnPress={onRefresh} />
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
}: {
  contentTopInset: number;
  debouncedHandleLoadMore: () => void;
  listHeader: React.ReactNode;
  listRef: React.RefObject<FlashListRef<TwitchStream> | null>;
  onRefresh: () => void;
  refreshing: boolean;
  remainingStreams: TwitchStream[];
  renderItem: ListRenderItem<TwitchStream>;
  scrollHandler: ReturnType<typeof useAnimatedScrollHandler>;
}) {
  return (
    <View style={styles.container}>
      <AnimatedFlashList
        ref={listRef}
        contentInsetAdjustmentBehavior='automatic'
        data={remainingStreams}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        removeClippedSubviews
        getItemType={() => 'stream-item'}
        drawDistance={500}
        contentContainerStyle={[
          styles.listContent,
          { paddingTop: contentTopInset },
        ]}
        ListHeaderComponent={() => listHeader}
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        onEndReached={debouncedHandleLoadMore}
        onScroll={scrollHandler}
        refreshing={refreshing}
        onEndReachedThreshold={0.3}
        onRefresh={onRefresh}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.color.background.dark,
    flex: 1,
  },
  listContent: {
    paddingBottom: theme.space20,
  },
  layoutToggleButton: {
    alignItems: 'center',
    backgroundColor: theme.color.background.darkAlt,
    borderColor: theme.colorBorderSecondary,
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  layoutToggleButtonActive: {
    backgroundColor: theme.darkActiveContent,
    borderColor: theme.color.border.dark,
  },
  layoutToggleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.space8,
    marginBottom: theme.space20,
    marginHorizontal: theme.space20,
  },
  layoutToggleText: {
    color: theme.color.textSecondary.dark,
  },
  layoutToggleTextActive: {
    color: theme.color.text.dark,
  },
});
