import { TwitchStream } from '@app/services/twitch-service';
import { theme } from '@app/styles/themes';
import { router } from 'expo-router';
import { elapsedStreamTime } from '@app/utils/string/elapsedStreamTime';
import { formatViewCount } from '@app/utils/string/formatViewCount';
import { memo, useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button } from '../Button/Button';
import { Image } from '../Image/Image';
import { PressableArea } from '../PressableArea/PressableArea';
import { Text } from '../Text/Text';

interface Props {
  stream: TwitchStream;
  layout?: 'compact' | 'media' | 'text';
}

export function LiveStreamCard({ stream, layout = 'compact' }: Props) {
  const isMediaLayout = layout === 'media';
  const isTextLayout = layout === 'text';
  const thumbnailUrl = stream.thumbnail_url
    .replace('{width}', '1920')
    .replace('{height}', '1080');

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

  const cardStyles = [
    styles.container,
    isTextLayout && styles.containerText,
    isMediaLayout && styles.containerMedia,
  ];
  const imageContainerStyle = [
    styles.imageContainer,
    isTextLayout && styles.imageContainerText,
    isMediaLayout && styles.imageContainerMedia,
  ];
  const imageStyle = [
    styles.image,
    isTextLayout && styles.imageText,
    isMediaLayout && styles.imageMedia,
  ];
  const imageWrapperStyle = [
    styles.imageWrapper,
    isTextLayout && styles.imageWrapperText,
    isMediaLayout && styles.imageWrapperMedia,
  ];

  return (
    <Button onPress={handleStreamPress} style={styles.cardWrapper}>
      <View style={cardStyles}>
        {!isTextLayout ? (
          <View style={imageContainerStyle}>
            <Image
              source={thumbnailUrl}
              style={imageStyle}
              containerStyle={imageWrapperStyle}
              transition={150}
            />
          </View>
        ) : null}

        <View style={styles.details}>
          <View style={styles.headerRow}>
            <PressableArea
              onPress={handleStreamerPress}
              onPressIn={handleStreamerPressIn}
              style={styles.usernameButton}
              hitSlop={8}
            >
              <Text
                type={isTextLayout ? 'xs' : 'sm'}
                weight="semibold"
                style={styles.username}
              >
                {stream.user_name}
              </Text>
            </PressableArea>

            {isTextLayout ? (
              <PressableArea
                onPress={handleCategoryPress}
                style={[styles.categoryBadge, styles.categoryBadgeText]}
                hitSlop={4}
              >
                <Text type="xxs" style={styles.categoryText}>
                  {stream.game_name}
                </Text>
              </PressableArea>
            ) : null}
          </View>

          <Text
            type={isTextLayout ? 'sm' : 'xs'}
            weight={isTextLayout ? 'semibold' : 'medium'}
            style={[
              styles.title,
              isMediaLayout && styles.titleMedia,
              isTextLayout && styles.titleText,
            ]}
            numberOfLines={isMediaLayout ? 2 : isTextLayout ? 3 : 2}
          >
            {stream.title}
          </Text>

          <View
            style={[styles.metadataRow, isTextLayout && styles.metadataRowText]}
          >
            <View style={styles.liveMeta}>
              <View style={styles.redDot} />
              <Text type="xxs" style={styles.liveText}>
                {elapsedStreamTime(stream.started_at)}
              </Text>
            </View>
            <Text type="xxs" style={styles.metaDivider}>
              •
            </Text>
            <Text type="xxs" style={styles.viewersText}>
              {formatViewCount(stream.viewer_count)} watching
            </Text>
          </View>

          {!isTextLayout ? (
            <PressableArea
              onPress={handleCategoryPress}
              style={[
                styles.categoryBadge,
                isMediaLayout && styles.categoryBadgeMedia,
              ]}
              hitSlop={4}
            >
              <Text type="xxs" style={styles.categoryText}>
                {stream.game_name}
              </Text>
            </PressableArea>
          ) : null}
        </View>

        {isTextLayout ? (
          <View style={imageContainerStyle}>
            <Image
              source={thumbnailUrl}
              style={imageStyle}
              containerStyle={imageWrapperStyle}
              transition={150}
            />
          </View>
        ) : null}
      </View>
    </Button>
  );
}

export const MemoizedLiveStreamCard = memo(LiveStreamCard);
MemoizedLiveStreamCard.displayName = 'MemoizedLiveStreamCard';

const styles = StyleSheet.create({
  cardWrapper: {
    width: '100%',
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: theme.darkActiveContent,
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius12,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  categoryBadgeMedia: {
    marginTop: 2,
  },
  categoryBadgeText: {
    marginLeft: 'auto',
  },
  categoryText: {
    color: theme.color.textSecondary.dark,
    fontWeight: '500',
    lineHeight: 14,
  },
  container: {
    alignItems: 'flex-start',
    backgroundColor: theme.color.background.darkAlt,
    borderColor: theme.colorBorderSecondary,
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius20,
    borderWidth: 1,
    flexDirection: 'row',
    flexWrap: 'nowrap',
    marginHorizontal: theme.space16,
    marginVertical: 5,
    minHeight: 112,
    overflow: 'hidden',
    paddingHorizontal: theme.space12,
    paddingVertical: 10,
  },
  containerMedia: {
    minHeight: 124,
  },
  containerText: {
    alignItems: 'stretch',
    minHeight: 104,
  },
  details: {
    flex: 1,
    flexShrink: 1,
    gap: 5,
    justifyContent: 'flex-start',
    minHeight: 76,
    minWidth: 0,
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.space8,
  },
  image: {
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius16,
    height: 88,
    width: 132,
  },
  imageContainer: {
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius16,
    flexShrink: 0,
    height: 88,
    marginRight: theme.space12,
    overflow: 'hidden',
    width: 132,
  },
  imageContainerMedia: {
    height: 98,
    width: 164,
  },
  imageContainerText: {
    alignSelf: 'center',
    height: 76,
    marginLeft: theme.space12,
    marginRight: 0,
    width: 108,
  },
  imageMedia: {
    height: 98,
    width: 164,
  },
  imageText: {
    height: 76,
    width: 108,
  },
  imageWrapper: {
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius16,
    height: 88,
    overflow: 'hidden',
    width: 132,
  },
  imageWrapperMedia: {
    height: 98,
    width: 164,
  },
  imageWrapperText: {
    height: 76,
    width: 108,
  },
  liveMeta: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  liveText: {
    color: theme.color.textSecondary.dark,
  },
  metaDivider: {
    color: theme.color.textSecondary.dark,
    opacity: 0.5,
  },
  metadataRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  metadataRowText: {
    marginTop: 'auto',
  },
  redDot: {
    backgroundColor: '#ff4444',
    borderRadius: 3,
    height: 6,
    width: 6,
  },
  title: {
    color: theme.color.text.dark,
    lineHeight: 18,
  },
  titleMedia: {
    lineHeight: 20,
  },
  titleText: {
    lineHeight: 20,
  },
  username: {
    color: theme.color.textSecondary.dark,
  },
  usernameButton: {
    alignSelf: 'flex-start',
    flex: 1,
    minWidth: 0,
  },
  viewersText: {
    color: theme.color.textSecondary.dark,
  },
});
