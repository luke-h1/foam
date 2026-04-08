import { useAppNavigation } from '@app/hooks/useAppNavigation';
import { TwitchStream } from '@app/services/twitch-service';
import { theme } from '@app/styles/themes';
import { elapsedStreamTime } from '@app/utils/string/elapsedStreamTime';
import { formatViewCount } from '@app/utils/string/formatViewCount';
import { useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { Button } from '../Button/Button';
import { Image } from '../Image/Image';
import { PressableArea } from '../PressableArea/PressableArea';
import { Text } from '../Text/Text';

interface Props {
  stream: TwitchStream;
}

export function LiveStreamCard({ stream }: Props) {
  const navigation = useAppNavigation();

  const handleStreamPress = useCallback(() => {
    navigation.navigate('Streams', {
      screen: 'LiveStream',
      params: { id: stream.user_login },
    });
  }, [navigation, stream.user_login]);

  const handleStreamerPressIn = useCallback(() => {
    navigation.preload('Streams', {
      screen: 'StreamerProfile',
      params: { id: stream.user_login },
    });
  }, [navigation, stream.user_login]);

  const handleStreamerPress = useCallback(() => {
    navigation.navigate('Streams', {
      screen: 'StreamerProfile',
      params: { id: stream.user_login },
    });
  }, [navigation, stream.user_login]);

  const handleCategoryPress = useCallback(() => {
    navigation.navigate('Category', { id: stream.game_id });
  }, [navigation, stream.game_id]);

  return (
    <Button onPress={handleStreamPress} style={styles.cardWrapper}>
      <View style={styles.container}>
        <View style={styles.imageContainer}>
          <Image
            source={stream?.thumbnail_url
              .replace('{width}', '1920')
              .replace('{height}', '1080')}
            style={styles.image}
            containerStyle={styles.imageWrapper}
            transition={150}
          />
        </View>
        <View style={styles.details}>
          <View style={styles.headerRow}>
            <PressableArea
              onPress={handleStreamerPress}
              onPressIn={handleStreamerPressIn}
              style={styles.usernameButton}
              hitSlop={8}
            >
              <Text type="sm" style={styles.username}>
                {stream.user_name}
              </Text>
            </PressableArea>
          </View>
          <View style={styles.metadataRow}>
            <View style={styles.liveBadge}>
              <View style={styles.redDot} />
              <Text type="xxs" style={styles.liveText}>
                {elapsedStreamTime(stream.started_at)}
              </Text>
            </View>
            <View style={styles.viewersBadge}>
              <View style={styles.viewersDot} />
              <Text type="xxs" style={styles.viewersText}>
                {formatViewCount(stream.viewer_count)}
              </Text>
            </View>
          </View>
          <PressableArea
            onPress={handleCategoryPress}
            style={styles.categoryBadge}
            hitSlop={4}
          >
            <Text type="xxs" style={styles.categoryText}>
              {stream.game_name}
            </Text>
          </PressableArea>
          <Text type="xs" style={styles.title} numberOfLines={2}>
            {stream.title}
          </Text>
        </View>
      </View>
    </Button>
  );
}

const styles = StyleSheet.create({
  cardWrapper: {
    width: '100%',
  },
  categoryBadge: {
    alignSelf: 'flex-start',
  },
  categoryText: {
    color: theme.colors.gray.textLow,
    fontWeight: '400',
  },
  container: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    flexWrap: 'nowrap',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.lg,
  },
  details: {
    flex: 1,
    flexShrink: 1,
    gap: theme.spacing.xs,
    justifyContent: 'flex-start',
    minWidth: 0,
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  image: {
    borderCurve: 'continuous',
    borderRadius: 8,
    height: 100,
    width: 150,
  },
  imageContainer: {
    borderCurve: 'continuous',
    borderRadius: 8,
    flexShrink: 0,
    height: 100,
    marginRight: theme.spacing.md,
    overflow: 'hidden',
    width: 150,
  },
  imageWrapper: {
    borderCurve: 'continuous',
    borderRadius: 8,
    height: 100,
    overflow: 'hidden',
    width: 150,
  },
  liveBadge: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  liveText: {
    color: theme.colors.gray.textLow,
  },
  metadataRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.xs,
  },
  redDot: {
    backgroundColor: '#ff4444',
    borderRadius: 4,
    height: 8,
    width: 8,
  },
  title: {
    color: theme.colors.gray.textLow,
    lineHeight: 18,
    marginTop: theme.spacing.xs,
  },
  username: {
    color: theme.colors.gray.text,
    fontWeight: '600',
  },
  usernameButton: {
    flex: 1,
    minWidth: 0,
  },
  viewersBadge: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 68, 68, 0.08)',
    borderCurve: 'continuous',
    borderRadius: 10,
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  viewersDot: {
    backgroundColor: '#ff4444',
    borderRadius: 2.5,
    height: 5,
    width: 5,
  },
  viewersText: {
    color: '#e57373',
    fontWeight: '500',
  },
});
