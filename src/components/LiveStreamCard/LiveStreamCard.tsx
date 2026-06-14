import { useCallback, memo } from 'react';
import { TwitchStream } from '@app/services/twitch-service';
import { theme } from '@app/styles/themes';
import { router } from 'expo-router';
import { elapsedStreamTime } from '@app/utils/string/elapsedStreamTime';
import {
  formatViewCount,
  formatViewCountCompact,
} from '@app/utils/string/formatViewCount';
import { StyleSheet, View } from 'react-native';
import { Button } from '../Button/Button';
import { Image } from '../Image/Image';
import { PressableArea } from '../PressableArea/PressableArea';
import { Text } from '@app/components/ui/Text/Text';

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

const TITLE_COLOR = 'rgba(235,235,240,0.86)';

function LiveStreamCard({ stream, layout = 'compact' }: Props) {
  const thumbnailUrl = stream.thumbnail_url
    .replace('{width}', '1920')
    .replace('{height}', '1080');

  const avatarInitial = stream.user_name.trim().charAt(0).toUpperCase();
  const languageLabel =
    stream.tags?.find(tag =>
      Object.values(LANGUAGE_NAMES).some(
        language => language.toLowerCase() === tag.toLowerCase(),
      ),
    ) ?? LANGUAGE_NAMES[stream.language];

  const handleStreamPress = useCallback(() => {
    router.push(`/streams/live-stream/${stream.user_login}`);
  }, [stream.user_login]);

  const handleStreamerPressIn = useCallback(() => {
    router.prefetch(`/streams/streamer-profile/${stream.user_login}`);
  }, [stream.user_login]);

  const handleStreamerPress = useCallback(() => {
    router.push(`/streams/streamer-profile/${stream.user_login}`);
  }, [stream.user_login]);

  const handleCategoryPress = useCallback(() => {
    router.push(`/category/${stream.game_id}`);
  }, [stream.game_id]);

  const cardAccessibilityLabel = `${stream.user_name}, live, ${
    stream.game_name
  }, ${formatViewCount(stream.viewer_count)} watching, ${stream.title}`;

  if (layout === 'media') {
    return (
      <Button
        onPress={handleStreamPress}
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
            <View style={[styles.compactLiveBadge, styles.mediaLiveBadge]}>
              <View style={styles.redDot} />
              <Text
                type='xxs'
                weight='bold'
                style={styles.compactLiveBadgeText}
              >
                LIVE
              </Text>
            </View>
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
              {stream.profilePicture ? (
                <Image
                  source={stream.profilePicture}
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
          <View style={styles.compactLiveBadge}>
            <View style={styles.redDot} />
            <Text type='xxs' weight='bold' style={styles.compactLiveBadgeText}>
              LIVE
            </Text>
          </View>
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
    color: theme.color.text.dark,
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
    color: theme.color.textSecondary.dark,
    lineHeight: 16,
  },
  container: {
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.055)',
    borderColor: 'rgba(255,255,255,0.13)',
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius10,
    borderWidth: 0.55,
    flexDirection: 'row',
    flexWrap: 'nowrap',
    marginHorizontal: theme.space16,
    marginVertical: 5,
    minHeight: 112,
    overflow: 'hidden',
    paddingHorizontal: theme.space12,
    paddingVertical: theme.space12,
  },
  details: {
    flex: 1,
    flexShrink: 1,
    gap: 4,
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
    color: theme.color.textSecondary.dark,
  },
  compactLiveBadge: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.68)',
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius6,
    columnGap: 4,
    flexDirection: 'row',
    left: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    position: 'absolute',
    top: 6,
  },
  compactLiveBadgeText: {
    color: theme.color.text.dark,
    letterSpacing: 0.4,
  },
  mediaCardWrapper: {
    width: '100%',
  },
  mediaCategory: {
    color: theme.color.textSecondary.dark,
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
    borderRadius: theme.borderRadius6,
    width: '100%',
  },
  mediaImageShell: {
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius6,
    overflow: 'hidden',
    position: 'relative',
    width: '100%',
  },
  mediaImageWrapper: {
    aspectRatio: 16 / 9,
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius6,
    overflow: 'hidden',
    width: '100%',
  },
  mediaTextColumn: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  mediaTitle: {
    color: TITLE_COLOR,
    lineHeight: 19,
  },
  mediaUsername: {
    color: theme.color.text.dark,
    lineHeight: 21,
  },
  metaDivider: {
    color: theme.color.textSecondary.dark,
    opacity: 0.5,
  },
  metadataRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'nowrap',
    gap: 6,
  },
  redDot: {
    backgroundColor: '#ff4444',
    borderRadius: 3,
    height: 6,
    width: 6,
  },
  title: {
    color: TITLE_COLOR,
    lineHeight: 19,
  },
  username: {
    color: theme.color.text.dark,
  },
  usernameButton: {
    alignSelf: 'flex-start',
    flex: 0,
    minWidth: 0,
  },
  viewersText: {
    color: theme.color.textSecondary.dark,
    flexShrink: 1,
  },
  viewerBadge: {
    backgroundColor: 'rgba(0,0,0,0.68)',
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius6,
    bottom: theme.space12,
    left: theme.space12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    position: 'absolute',
  },
  viewerBadgeText: {
    color: theme.color.text.dark,
    lineHeight: 20,
  },
});
