import { memo, useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';

import { LiveBadge } from '@app/components/LiveBadge/LiveBadge';
import { Text } from '@app/components/ui/Text/Text';
import { impact } from '@app/lib/haptics';
import { userQueryOptions } from '@app/lib/react-query/queries/twitch';
import { twitchKeys } from '@app/lib/react-query/query-keys';
import { Color } from '@app/styles/pallete';
import { theme } from '@app/styles/themes';
import type { TwitchStream } from '@app/types/twitch/stream';
import { showActionMenu } from '@app/utils/actionMenu/showActionMenu';
import { shareDeepLink } from '@app/utils/sharing/shareDeepLink';
import { elapsedStreamTime } from '@app/utils/string/elapsedStreamTime';
import {
  formatViewCount,
  formatViewCountCompact,
} from '@app/utils/string/formatViewCount';

import { Button } from '../Button/Button';
import { Image } from '../Image/Image';
import { PressableArea } from '../PressableArea/PressableArea';

interface Props {
  stream: TwitchStream;
  layout?: 'compact' | 'media';
}

const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English',
  es: 'Spanish',
  ja: 'Japanese',
  ko: 'Korean',
  fr: 'French',
  de: 'German',
  pt: 'Portuguese',
};

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

function LiveStreamCard({ stream, layout = 'compact' }: Props) {
  const { t } = useTranslation('common');
  const queryClient = useQueryClient();
  const thumbnailUrl = stream.thumbnail_url
    .replace('{width}', '1920')
    .replace('{height}', '1080');

  const avatarInitial = stream.user_name.trim().charAt(0).toUpperCase();

  const { data: streamerInfo } = useQuery({
    ...userQueryOptions(stream.user_login),
    enabled: layout === 'media' && !stream.profilePicture,
  });
  const profilePicture =
    stream.profilePicture ?? streamerInfo?.profile_image_url;
  const languageLabel =
    stream.tags?.find(tag =>
      Object.values(LANGUAGE_NAMES).some(
        language => language.toLowerCase() === tag.toLowerCase(),
      ),
    ) ?? LANGUAGE_NAMES[stream.language];

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
    void impact('medium');
    showActionMenu({
      title: stream.user_name,
      actions: [
        {
          label: t('viewProfile'),
          onPress: () =>
            pushRouteOnce(`/streams/streamer-profile/${stream.user_login}`),
        },
        {
          label: t('shareChannel'),
          onPress: () => {
            void shareDeepLink({
              kind: 'liveStream',
              login: stream.user_login,
              displayName: stream.user_name,
            });
          },
        },
      ],
      cancelLabel: t('cancel'),
    });
  }, [stream.user_login, stream.user_name, t]);

  const cardAccessibilityLabel = `${stream.user_name}, live, ${
    stream.game_name
  }, ${formatViewCount(stream.viewer_count)} watching, ${stream.title}`;

  if (layout === 'media') {
    return (
      <Button
        onPress={handleStreamPress}
        onPressIn={handleStreamPressIn}
        onLongPress={handleLongPress}
        label={cardAccessibilityLabel}
        style={styles.mediaCardWrapper}
      >
        <View style={styles.mediaContainer}>
          <View style={styles.mediaImageShell}>
            <Image
              source={thumbnailUrl}
              style={styles.mediaImage}
              containerStyle={styles.mediaImageWrapper}
              transition={150}
            />
            <LiveBadge
              style={[styles.compactLiveBadge, styles.mediaLiveBadge]}
            />
            <View style={styles.viewerBadge}>
              <Text type='sm' weight='bold' style={styles.viewerBadgeText}>
                {formatViewCountCompact(stream.viewer_count)} watching
              </Text>
            </View>
          </View>

          <View style={styles.mediaDetailsRow}>
            <PressableArea
              accessibilityLabel={`${stream.user_name}'s profile`}
              onPress={handleStreamerPress}
              onPressIn={handleStreamerPressIn}
              style={styles.avatarPressable}
              hitSlop={8}
            >
              {profilePicture ? (
                <Image
                  source={profilePicture}
                  style={styles.avatarImage}
                  containerStyle={styles.avatarImageWrapper}
                  transition={150}
                />
              ) : (
                <View style={styles.avatarFallback}>
                  <Text type='md' weight='bold' style={styles.avatarInitial}>
                    {avatarInitial}
                  </Text>
                </View>
              )}
            </PressableArea>

            <View style={styles.mediaTextColumn}>
              <PressableArea
                accessibilityLabel={`${stream.user_name}'s profile`}
                onPress={handleStreamerPress}
                onPressIn={handleStreamerPressIn}
                hitSlop={6}
              >
                <Text
                  type='md'
                  weight='semibold'
                  style={styles.mediaUsername}
                  numberOfLines={1}
                >
                  {stream.user_name}
                </Text>
              </PressableArea>
              <Text
                type='sm'
                weight='medium'
                numberOfLines={2}
                style={styles.mediaTitle}
              >
                {stream.title}
              </Text>
              <PressableArea
                accessibilityLabel={`${stream.game_name} category`}
                onPress={handleCategoryPress}
                hitSlop={6}
              >
                <Text
                  type='sm'
                  weight='medium'
                  style={styles.mediaCategory}
                  numberOfLines={1}
                >
                  {stream.game_name}
                  {languageLabel ? `  •  ${languageLabel}` : ''}
                </Text>
              </PressableArea>
            </View>
          </View>
        </View>
      </Button>
    );
  }

  return (
    <Button
      onPress={handleStreamPress}
      onPressIn={handleStreamPressIn}
      onLongPress={handleLongPress}
      label={cardAccessibilityLabel}
      style={styles.cardWrapper}
    >
      <View style={styles.container}>
        <View style={styles.imageContainer}>
          <Image
            source={thumbnailUrl}
            style={styles.image}
            containerStyle={styles.imageWrapper}
            transition={150}
          />
          <LiveBadge style={styles.compactLiveBadge} />
        </View>

        <View style={styles.details}>
          <PressableArea
            accessibilityLabel={`${stream.user_name}'s profile`}
            onPress={handleStreamerPress}
            onPressIn={handleStreamerPressIn}
            style={styles.usernameButton}
            hitSlop={8}
          >
            <Text
              type='sm'
              weight='semibold'
              numberOfLines={1}
              style={styles.username}
            >
              {stream.user_name}
            </Text>
          </PressableArea>

          <Text
            type='sm'
            weight='normal'
            style={styles.title}
            numberOfLines={2}
          >
            {stream.title}
          </Text>

          <View style={styles.metadataRow}>
            <View style={styles.liveMeta}>
              <Text type='xs' style={styles.liveText}>
                {elapsedStreamTime(stream.started_at)}
              </Text>
            </View>
            <Text type='xs' style={styles.metaDivider}>
              •
            </Text>
            <Text type='xs' numberOfLines={1} style={styles.viewersText}>
              {formatViewCountCompact(stream.viewer_count)} watching
            </Text>
          </View>

          <PressableArea
            onPress={handleCategoryPress}
            style={styles.categoryButton}
            hitSlop={6}
          >
            <Text type='xs' numberOfLines={1} style={styles.categoryText}>
              {stream.game_name}
            </Text>
          </PressableArea>
        </View>
      </View>
    </Button>
  );
}

export const MemoizedLiveStreamCard = memo(LiveStreamCard);

const styles = StyleSheet.create({
  cardWrapper: {
    width: '100%',
  },
  avatarFallback: {
    alignItems: 'center',
    backgroundColor: theme.darkActiveContent,
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius999,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  avatarImage: {
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius999,
    height: 44,
    width: 44,
  },
  avatarImageWrapper: {
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius999,
    height: 44,
    overflow: 'hidden',
    width: 44,
  },
  avatarInitial: {
    color: Color.zinc[50],
  },
  avatarPressable: {
    flexShrink: 0,
    marginTop: 2,
  },
  categoryButton: {
    alignSelf: 'flex-start',
    minWidth: 0,
  },
  categoryText: {
    color: Color.zinc[300],
    lineHeight: 16,
  },
  container: {
    alignItems: 'flex-start',
    backgroundColor: Color.zinc[900],
    borderColor: theme.color.border.dark,
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius10,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    flexWrap: 'nowrap',
    marginHorizontal: theme.space16,
    marginVertical: theme.space4,
    minHeight: 112,
    overflow: 'hidden',
    paddingHorizontal: theme.space8,
    paddingVertical: theme.space8,
  },
  details: {
    flex: 1,
    flexShrink: 1,
    gap: theme.space2,
    justifyContent: 'flex-start',
    minHeight: 88,
    minWidth: 0,
  },
  image: {
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius6,
    height: 88,
    width: 132,
  },
  imageContainer: {
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius6,
    flexShrink: 0,
    height: 88,
    marginRight: theme.space12,
    overflow: 'hidden',
    width: 132,
  },
  imageWrapper: {
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius6,
    height: 88,
    overflow: 'hidden',
    width: 132,
  },
  liveMeta: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  mediaLiveBadge: {
    left: theme.space12,
    top: theme.space12,
  },
  liveText: {
    color: Color.zinc[300],
  },
  compactLiveBadge: {
    left: 6,
    position: 'absolute',
    top: 6,
  },
  mediaCardWrapper: {
    width: '100%',
  },
  mediaCategory: {
    color: Color.zinc[300],
    lineHeight: 20,
  },
  mediaContainer: {
    marginHorizontal: theme.space16,
    marginVertical: theme.space12,
  },
  mediaDetailsRow: {
    flexDirection: 'row',
    gap: theme.space12,
    marginTop: theme.space12,
  },
  mediaImage: {
    aspectRatio: 16 / 9,
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius8,
    width: '100%',
  },
  mediaImageShell: {
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius8,
    overflow: 'hidden',
    position: 'relative',
    width: '100%',
  },
  mediaImageWrapper: {
    aspectRatio: 16 / 9,
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius8,
    overflow: 'hidden',
    width: '100%',
  },
  mediaTextColumn: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  mediaTitle: {
    color: Color.zinc[100],
    lineHeight: 19,
  },
  mediaUsername: {
    color: Color.zinc[50],
    lineHeight: 21,
  },
  metaDivider: {
    color: Color.zinc[400],
    opacity: 0.5,
  },
  metadataRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'nowrap',
    gap: 6,
    marginTop: theme.space4,
  },
  title: {
    color: Color.zinc[100],
    lineHeight: 19,
  },
  username: {
    color: Color.zinc[50],
  },
  usernameButton: {
    alignSelf: 'flex-start',
    flex: 0,
    minWidth: 0,
  },
  viewersText: {
    color: Color.zinc[300],
    flexShrink: 1,
  },
  viewerBadge: {
    backgroundColor: 'rgba(0,0,0,0.68)',
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius4,
    bottom: theme.space12,
    left: theme.space12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    position: 'absolute',
  },
  viewerBadgeText: {
    color: Color.zinc[50],
    lineHeight: 20,
  },
});
