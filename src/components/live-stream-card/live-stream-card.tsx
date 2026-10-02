import { memo, useCallback } from 'react';
import { StyleSheet, View } from 'react-native';

import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';

import { LiveBadge } from '@app/components/live-badge/live-badge';
import { Text } from '@app/components/ui/text/text';
import { impact } from '@app/lib/haptics';
import { twitchKeys } from '@app/lib/react-query/query-keys';
import { showActionMenu } from '@app/store/overlays/show-action-menu';
import { theme } from '@app/styles/themes';
import type { TwitchStream } from '@app/types/twitch/stream';
import { shareDeepLink } from '@app/utils/sharing/share-deep-link';
import { elapsedStreamTime } from '@app/utils/string/elapsed-stream-time';
import {
  formatViewCount,
  formatViewCountCompact,
} from '@app/utils/string/format-view-count';

import { Avatar } from '../avatar/avatar';
import { Button } from '../button/button';
import { Image } from '../image/image';
import { PressableArea } from '../pressable-area/pressable-area';
import {
  COMPACT_THUMBNAIL_SIZE,
  MEDIA_THUMBNAIL_SIZE,
} from './util/thumbnail-sizes';

interface Props {
  stream: TwitchStream;
  layout?: 'compact' | 'media';
  /**
   * Hide the category line on a list that is already one category.
   */
  showCategory?: boolean;
}

const LANGUAGE_NAMES = new Map([
  ['en', 'English'],
  ['es', 'Spanish'],
  ['ja', 'Japanese'],
  ['ko', 'Korean'],
  ['fr', 'French'],
  ['de', 'German'],
  ['pt', 'Portuguese'],
]);

const LANGUAGE_VALUE_SET = new Set(
  Array.from(LANGUAGE_NAMES.values(), language => language.toLowerCase()),
);

// Dedupe rapid double-taps that would push the same route twice (two stacked screens).
const NAV_DEDUPE_MS = 1000;

let lastNavPath = '';
let lastNavAt = 0;

function pushRouteOnce(path: string) {
  const now = Date.now();

  if (path === lastNavPath && now - lastNavAt < NAV_DEDUPE_MS) {
    return;
  }

  lastNavPath = path;
  lastNavAt = now;
  router.push(path);
}

function LiveStreamCard({
  stream,
  layout = 'compact',
  showCategory = true,
}: Props) {
  const queryClient = useQueryClient();

  const thumbnailSize =
    layout === 'media' ? MEDIA_THUMBNAIL_SIZE : COMPACT_THUMBNAIL_SIZE;

  const thumbnailUrl = stream.thumbnail_url
    .replace('{width}', thumbnailSize.width)
    .replace('{height}', thumbnailSize.height);

  // Media-layout avatars come pre-batched via useStreamProfilePictures at the
  // list level - one /users request per screen, not one per visible card.
  const profilePicture = stream.profilePicture;

  const handleStreamPressIn = useCallback(() => {
    router.prefetch(`/streams/live-stream/${stream.user_login}`);
  }, [stream.user_login]);

  const handleStreamPress = useCallback(() => {
    queryClient.setQueryData(twitchKeys.stream(stream.user_login), stream);
    pushRouteOnce(`/streams/live-stream/${stream.user_login}`);
  }, [queryClient, stream]);

  const handleStreamerPressIn = useCallback(() => {
    router.prefetch(`/streams/streamer-profile/${stream.user_login}`);
  }, [stream.user_login]);

  const handleStreamerPress = useCallback(() => {
    pushRouteOnce(`/streams/streamer-profile/${stream.user_login}`);
  }, [stream.user_login]);

  const handleCategoryPress = useCallback(() => {
    pushRouteOnce(`/category/${stream.game_id}`);
  }, [stream.game_id]);

  const handleLongPress = useCallback(() => {
    impact('medium');

    showActionMenu({
      title: stream.user_name,
      actions: [
        {
          label: 'View profile',
          onPress: () =>
            pushRouteOnce(`/streams/streamer-profile/${stream.user_login}`),
        },
        {
          label: 'Share channel',
          onPress: () => {
            void shareDeepLink({
              kind: 'liveStream',
              login: stream.user_login,
              displayName: stream.user_name,
            });
          },
        },
      ],
      cancelLabel: 'Cancel',
    });
  }, [stream.user_login, stream.user_name]);

  const cardAccessibilityLabel = `${stream.user_name}, live, ${
    stream.game_name
  }, ${formatViewCount(stream.viewer_count)} watching, ${stream.title}`;

  const viewerLabel = formatViewCountCompact(stream.viewer_count);

  if (layout === 'media') {
    // Only the media layout renders the language, so keep the tag scan out of
    // the (default) compact path.
    const languageLabel =
      stream.tags?.find(tag => LANGUAGE_VALUE_SET.has(tag.toLowerCase())) ??
      LANGUAGE_NAMES.get(stream.language);

    return (
      <Button
        onPress={handleStreamPress}
        onPressIn={handleStreamPressIn}
        onLongPress={handleLongPress}
        label={cardAccessibilityLabel}
        style={styles.mediaCard}
      >
        <View>
          <Image
            source={thumbnailUrl}
            style={styles.mediaImage}
            containerStyle={styles.mediaImage}
            transition={150}
          />
          <LiveBadge label={viewerLabel} style={styles.thumbnailBadge} />
        </View>

        <View style={styles.mediaDetailsRow}>
          <PressableArea
            accessibilityLabel={`${stream.user_name}'s profile`}
            onPress={handleStreamerPress}
            onPressIn={handleStreamerPressIn}
            hitSlop={8}
          >
            <Avatar uri={profilePicture} name={stream.user_name} size={36} />
          </PressableArea>

          <View style={styles.details}>
            <Text type='callout' weight='semibold' numberOfLines={1}>
              {stream.user_name}
            </Text>
            <Text type='subhead' color='gray.textLow' numberOfLines={2}>
              {stream.title}
            </Text>
            {showCategory ? (
              <PressableArea
                accessibilityLabel={`${stream.game_name} category`}
                onPress={handleCategoryPress}
                hitSlop={6}
                style={styles.categoryButton}
              >
                <Text type='footnote' color='gray.textLow' numberOfLines={1}>
                  {languageLabel
                    ? `${stream.game_name} · ${languageLabel}`
                    : stream.game_name}
                </Text>
              </PressableArea>
            ) : null}
          </View>
        </View>
      </Button>
    );
  }

  return (
    <PressableArea
      feedback='highlight'
      onPress={handleStreamPress}
      onPressIn={handleStreamPressIn}
      onLongPress={handleLongPress}
      accessibilityLabel={cardAccessibilityLabel}
    >
      <View style={styles.row}>
        <View>
          <Image
            source={thumbnailUrl}
            style={styles.thumbnail}
            containerStyle={styles.thumbnail}
            transition={150}
          />
          <LiveBadge label={viewerLabel} style={styles.thumbnailBadge} />
        </View>

        <View style={styles.details}>
          <PressableArea
            accessibilityLabel={`${stream.user_name}'s profile`}
            onPress={handleStreamerPress}
            onPressIn={handleStreamerPressIn}
            hitSlop={8}
            style={styles.inlineButton}
          >
            <Text type='callout' weight='semibold' numberOfLines={1}>
              {stream.user_name}
            </Text>
          </PressableArea>

          <Text type='subhead' color='gray.textLow' numberOfLines={2}>
            {stream.title}
          </Text>

          {showCategory ? (
            <PressableArea
              accessibilityLabel={`${stream.game_name} category`}
              onPress={handleCategoryPress}
              hitSlop={6}
              style={styles.inlineButton}
            >
              <Text
                type='footnote'
                color='gray.textLow'
                tabular
                numberOfLines={1}
              >
                {`${stream.game_name} · ${elapsedStreamTime(stream.started_at)}`}
              </Text>
            </PressableArea>
          ) : (
            <Text type='footnote' color='gray.textLow' tabular>
              {`Live for ${elapsedStreamTime(stream.started_at)}`}
            </Text>
          )}
        </View>
      </View>
    </PressableArea>
  );
}

export const MemoizedLiveStreamCard = memo(LiveStreamCard);

const styles = StyleSheet.create({
  row: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: theme.space12,
    paddingHorizontal: theme.space16,
    paddingVertical: theme.space8,
  },
  thumbnail: {
    aspectRatio: 16 / 9,
    borderCurve: 'continuous',
    borderRadius: theme.radius.md,
    overflow: 'hidden',
    width: 144,
  },
  thumbnailBadge: {
    bottom: theme.space8,
    left: theme.space8,
    position: 'absolute',
  },
  details: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  inlineButton: {
    alignSelf: 'flex-start',
    maxWidth: '100%',
  },
  mediaCard: {
    paddingHorizontal: theme.space16,
    paddingVertical: theme.space12,
  },
  mediaImage: {
    aspectRatio: 16 / 9,
    borderCurve: 'continuous',
    borderRadius: theme.radius.md,
    overflow: 'hidden',
    width: '100%',
  },
  mediaDetailsRow: {
    flexDirection: 'row',
    gap: theme.space12,
    marginTop: theme.space12,
  },
  categoryButton: {
    alignSelf: 'flex-start',
    marginTop: 2,
    maxWidth: '100%',
  },
});
