import { memo, useCallback, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';

import { FlashList } from '@app/components/flash-list/flash-list';
import { Image } from '@app/components/image/image';
import { PressableArea } from '@app/components/pressable-area/pressable-area';
import { EmptyState } from '@app/components/ui/empty-state/empty-state';
import { Skeleton } from '@app/components/ui/skeleton/skeleton';
import { Text } from '@app/components/ui/text/text';
import { twitchKeys } from '@app/lib/react-query/query-keys';
import { twitchService } from '@app/services/twitch-service';
import { removeCreatedClip } from '@app/store/created-clips/actions/created-clips';
import type { CreatedClipRecord } from '@app/store/created-clips/observables/created-clips';
import { useCreatedClips } from '@app/store/created-clips/react/selectors';
import { showActionMenu } from '@app/store/overlays/show-action-menu';
import { theme } from '@app/styles/themes';
import type { TwitchClip } from '@app/types/twitch/clip';
import { formatViewCount } from '@app/utils/string/format-view-count';

interface MyClipListItem {
  record: CreatedClipRecord;
  clip?: TwitchClip;
  /**
   * True while clip details are still loading, so the row shows a
   * placeholder instead of "Processing".
   */
  loading: boolean;
}

const MyClipRow = memo(function MyClipRow({
  clip,
  record,
  loading,
}: MyClipListItem) {
  const handlePress = useCallback(() => {
    router.push(`/streams/clip/${encodeURIComponent(record.id)}`);
  }, [record.id]);

  const handleLongPress = useCallback(() => {
    showActionMenu({
      title: clip?.title || record.broadcasterName,
      actions: [
        {
          label: 'Remove from My clips',
          onPress: () => removeCreatedClip(record.id),
        },
      ],
      cancelLabel: 'Cancel',
    });
  }, [clip?.title, record.broadcasterName, record.id]);

  const thumbnail = clip?.thumbnail_url || undefined;

  return (
    <PressableArea
      feedback='highlight'
      accessibilityLabel={clip?.title || 'Untitled clip'}
      onPress={handlePress}
      onLongPress={handleLongPress}
    >
      <View style={styles.row}>
        {thumbnail ? (
          <Image
            source={thumbnail}
            cacheVariant='thumbnail'
            style={styles.thumbnail}
            containerStyle={styles.thumbnail}
            transition={150}
          />
        ) : (
          <Skeleton shimmer={loading} style={styles.thumbnail} />
        )}
        <View style={styles.rowText}>
          {loading && !clip ? (
            <Skeleton style={styles.skeletonTitle} />
          ) : (
            <Text numberOfLines={2} type='callout' weight='semibold'>
              {clip ? clip.title || 'Untitled clip' : 'Processing…'}
            </Text>
          )}
          <Text numberOfLines={1} type='subhead' color='gray.textLow'>
            {clip
              ? `${record.broadcasterName} · ${formatViewCount(clip.view_count)} views`
              : record.broadcasterName}
          </Text>
        </View>
      </View>
    </PressableArea>
  );
});

function renderMyClipRow({ item }: { item: MyClipListItem }) {
  return (
    <MyClipRow clip={item.clip} record={item.record} loading={item.loading} />
  );
}

function myClipKeyExtractor(item: MyClipListItem): string {
  return item.record.id;
}

export function MyClipsScreen() {
  const records = useCreatedClips();
  const clipIds = useMemo(() => records.map(record => record.id), [records]);

  const {
    data: clips,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: twitchKeys.clipsByIds(clipIds),
    queryFn: () => twitchService.getClipsByIds(clipIds),
    enabled: clipIds.length > 0,
    staleTime: 60_000,
  });

  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await refetch().finally(() => setIsRefreshing(false));
  }, [refetch]);

  const rows = useMemo<MyClipListItem[]>(() => {
    const clipsById = new Map(
      (clips ?? []).map(clip => [clip.id, clip] as const),
    );
    return records.map(record => ({
      record,
      clip: clipsById.get(record.id),
      loading: isLoading,
    }));
  }, [records, clips, isLoading]);

  if (records.length === 0) {
    return (
      <EmptyState
        content='Create one from the live player.'
        heading='No clips yet'
        iconName='scissors'
        style={styles.emptyState}
      />
    );
  }

  return (
    <View style={styles.container}>
      <FlashList<MyClipListItem>
        data={rows}
        keyExtractor={myClipKeyExtractor}
        contentInsetAdjustmentBehavior='automatic'
        renderItem={renderMyClipRow}
        contentContainerStyle={styles.listContent}
        refreshing={isRefreshing}
        onRefresh={handleRefresh}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.color.background.dark,
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    backgroundColor: theme.color.background.dark,
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: theme.space20,
  },
  listContent: {
    paddingVertical: theme.space8,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.space12,
    paddingHorizontal: theme.space16,
    paddingVertical: theme.space8,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  skeletonTitle: {
    height: 13,
    marginVertical: 4,
    width: '70%',
  },
  thumbnail: {
    aspectRatio: 16 / 9,
    borderCurve: 'continuous',
    borderRadius: theme.radius.md,
    overflow: 'hidden',
    width: 112,
  },
});
