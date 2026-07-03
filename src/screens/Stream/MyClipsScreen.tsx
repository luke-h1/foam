import { memo, useCallback, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';

import { Button } from '@app/components/Button/Button';
import { FlashList } from '@app/components/FlashList/FlashList';
import { Image } from '@app/components/Image/Image';
import { EmptyState } from '@app/components/ui/EmptyState/EmptyState';
import { Text } from '@app/components/ui/Text/Text';
import i18next from '@app/i18n/i18next';
import { twitchKeys } from '@app/lib/react-query/query-keys';
import { twitchService } from '@app/services/twitch-service';
import { useCreatedClips } from '@app/store/createdClips/selectors';
import {
  type CreatedClipRecord,
  removeCreatedClip,
} from '@app/store/createdClips/state';
import { theme } from '@app/styles/themes';
import type { TwitchClip } from '@app/types/twitch/clip';
import { showActionMenu } from '@app/utils/actionMenu/showActionMenu';

interface MyClipListItem {
  record: CreatedClipRecord;
  clip?: TwitchClip;
}

const MyClipRow = memo(function MyClipRow({ clip, record }: MyClipListItem) {
  const { t } = useTranslation('stream');

  const handlePress = useCallback(() => {
    router.push(`/streams/clip/${encodeURIComponent(record.id)}`);
  }, [record.id]);

  const handleLongPress = useCallback(() => {
    showActionMenu({
      title: clip?.title || record.broadcasterName,
      actions: [
        {
          label: i18next.t('stream:removeFromMyClips'),
          onPress: () => removeCreatedClip(record.id),
        },
      ],
      cancelLabel: i18next.t('common:cancel'),
    });
  }, [clip?.title, record.broadcasterName, record.id]);

  const thumbnail = clip?.thumbnail_url || undefined;

  return (
    <Button
      label={clip?.title || t('untitledClip')}
      onPress={handlePress}
      onLongPress={handleLongPress}
      style={styles.row}
    >
      {thumbnail ? (
        <Image
          source={thumbnail}
          style={styles.thumbnail}
          containerStyle={styles.thumbnailWrapper}
          transition={150}
        />
      ) : (
        <View style={[styles.thumbnailWrapper, styles.thumbnailEmpty]} />
      )}
      <View style={styles.rowText}>
        <Text numberOfLines={2} type='sm' weight='semibold'>
          {clip ? clip.title || t('untitledClip') : t('clipProcessing')}
        </Text>
        <Text numberOfLines={1} type='xs' color='gray'>
          {record.broadcasterName}
        </Text>
        {clip ? (
          <Text numberOfLines={1} type='xs' color='gray'>
            {t('clipViews', { count: clip.view_count })}
          </Text>
        ) : null}
      </View>
    </Button>
  );
});

function renderMyClipRow({ item }: { item: MyClipListItem }) {
  return <MyClipRow clip={item.clip} record={item.record} />;
}

function myClipKeyExtractor(item: MyClipListItem): string {
  return item.record.id;
}

export function MyClipsScreen() {
  const { t } = useTranslation('stream');
  const records = useCreatedClips();
  const clipIds = useMemo(() => records.map(record => record.id), [records]);

  const { data: clips } = useQuery({
    queryKey: twitchKeys.clipsByIds(clipIds),
    queryFn: () => twitchService.getClipsByIds(clipIds),
    enabled: clipIds.length > 0,
    staleTime: 60_000,
  });

  const rows = useMemo<MyClipListItem[]>(() => {
    const clipsById = new Map(
      (clips ?? []).map(clip => [clip.id, clip] as const),
    );
    return records.map(record => ({
      record,
      clip: clipsById.get(record.id),
    }));
  }, [records, clips]);

  if (records.length === 0) {
    return (
      <EmptyState
        button={null}
        content={t('myClipsEmptyDescription')}
        heading={t('myClipsEmpty')}
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
  thumbnail: {
    height: '100%',
    width: '100%',
  },
  thumbnailEmpty: {
    backgroundColor: theme.darkActiveContent,
  },
  thumbnailWrapper: {
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius8,
    height: 54,
    overflow: 'hidden',
    width: 96,
  },
});
