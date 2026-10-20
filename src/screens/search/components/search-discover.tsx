import { memo, useMemo } from 'react';
import {
  ScrollView,
  type StyleProp,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native';

import { useInfiniteQuery } from '@tanstack/react-query';
import { router } from 'expo-router';

import { Avatar } from '@app/components/avatar/avatar';
import { Button } from '@app/components/button/button';
import { MemoizedCategoryCard } from '@app/components/category-card/category-card';
import { SectionHeader } from '@app/components/section-header/section-header';
import { Skeleton } from '@app/components/ui/skeleton/skeleton';
import { Text } from '@app/components/ui/text/text';
import { useStreamProfilePictures } from '@app/hooks/queries/use-stream-profile-pictures';
import { useFlattenedInfiniteQuery } from '@app/hooks/use-flattened-infinite-query';
import {
  topCategoriesInfiniteQueryOptions,
  topStreamsInfiniteQueryOptions,
} from '@app/lib/react-query/queries/twitch';
import { theme } from '@app/styles/themes';
import type { TwitchStream } from '@app/types/twitch/stream';
import { formatViewCountCompact } from '@app/utils/string/format-view-count';

const RAIL_LENGTH = 15;
const AVATAR_SIZE = 64;
const TILE_WIDTH = 104;
const SKELETON_KEYS = ['a', 'b', 'c', 'd', 'e'];

const ChannelItem = memo(function ChannelItem({
  stream,
}: {
  stream: TwitchStream;
}) {
  return (
    <Button
      label={`${stream.user_name}, live, ${formatViewCountCompact(stream.viewer_count)} watching`}
      onPressIn={() =>
        router.prefetch(`/streams/live-stream/${stream.user_login}`)
      }
      onPress={() => router.push(`/streams/live-stream/${stream.user_login}`)}
      style={styles.channel}
    >
      <View style={styles.avatarRing}>
        <Avatar
          uri={stream.profilePicture}
          name={stream.user_name}
          size={AVATAR_SIZE}
        />
      </View>
      <Text type='footnote' weight='medium' align='center' numberOfLines={1}>
        {stream.user_name}
      </Text>
      <Text type='caption' color='gray.textLow' align='center' tabular>
        {formatViewCountCompact(stream.viewer_count)}
      </Text>
    </Button>
  );
});

interface RailSkeletonProps {
  cellStyle: StyleProp<ViewStyle>;
  mediaStyle: StyleProp<ViewStyle>;
}

function RailSkeleton({ cellStyle, mediaStyle }: RailSkeletonProps) {
  return (
    <View style={styles.skeletonRow}>
      {SKELETON_KEYS.map(key => (
        <View key={key} style={cellStyle}>
          <Skeleton style={mediaStyle} />
          <Skeleton style={styles.lineSkeleton} />
        </View>
      ))}
    </View>
  );
}

/**
 * The search landing below recent searches: who is live now and the top
 * categories, both from the same queries the Top tab already caches. A rail
 * shows a skeleton only while its first page loads. A rail that fails or
 * comes back empty is left out rather than shown as an error.
 */
export function SearchDiscover() {
  const streamsQuery = useInfiniteQuery(topStreamsInfiniteQueryOptions());
  const categoriesQuery = useInfiniteQuery(topCategoriesInfiniteQueryOptions());

  const allStreams = useFlattenedInfiniteQuery(streamsQuery.data?.pages);

  const streams = useMemo(() => allStreams.slice(0, RAIL_LENGTH), [allStreams]);

  const streamsWithAvatars = useStreamProfilePictures(streams, true);

  const allCategories = useFlattenedInfiniteQuery(categoriesQuery.data?.pages);

  const categories = useMemo(
    () => allCategories.slice(0, RAIL_LENGTH),
    [allCategories],
  );

  return (
    <View>
      {!streamsQuery.isPending && streams.length === 0 ? null : (
        <>
          <SectionHeader title='Live now' />
          {streams.length === 0 ? (
            <RailSkeleton
              cellStyle={styles.channel}
              mediaStyle={styles.avatarSkeleton}
            />
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.rail}
            >
              {/* eslint-disable-next-line react-doctor/rn-no-scrollview-mapped-list -- capped at RAIL_LENGTH items */}
              {streamsWithAvatars.map(stream => (
                <ChannelItem key={stream.id} stream={stream} />
              ))}
            </ScrollView>
          )}
        </>
      )}

      {!categoriesQuery.isPending && categories.length === 0 ? null : (
        <>
          <SectionHeader title='Top categories' />
          {categories.length === 0 ? (
            <RailSkeleton cellStyle={styles.tile} mediaStyle={styles.boxArt} />
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.rail}
            >
              {/* eslint-disable-next-line react-doctor/rn-no-scrollview-mapped-list -- capped at RAIL_LENGTH items */}
              {categories.map(category => (
                <View key={category.id} style={styles.tile}>
                  <MemoizedCategoryCard category={category} />
                </View>
              ))}
            </ScrollView>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  /**
   * A thin live ring: it says "live" without a badge on every avatar.
   */
  avatarRing: {
    borderColor: theme.color.live.dark,
    borderRadius: theme.radius.full,
    borderWidth: 2,
    marginBottom: theme.space4,
    padding: 2,
  },
  avatarSkeleton: {
    borderRadius: theme.radius.full,
    height: AVATAR_SIZE + 8,
    marginBottom: theme.space4,
    width: AVATAR_SIZE + 8,
  },
  boxArt: {
    aspectRatio: 3 / 4,
    borderCurve: 'continuous',
    borderRadius: theme.radius.md,
    marginBottom: theme.space8,
    overflow: 'hidden',
    width: TILE_WIDTH,
  },
  channel: {
    alignItems: 'center',
    gap: 2,
    width: AVATAR_SIZE + 16,
  },
  lineSkeleton: {
    height: 10,
    marginTop: theme.space4,
    width: 56,
  },
  rail: {
    gap: theme.space12,
    paddingBottom: theme.space8,
    paddingHorizontal: theme.space16,
  },
  skeletonRow: {
    flexDirection: 'row',
    gap: theme.space12,
    overflow: 'hidden',
    paddingBottom: theme.space8,
    paddingHorizontal: theme.space16,
  },
  tile: {
    width: TILE_WIDTH,
  },
});
