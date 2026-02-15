import { useAppNavigation } from '@app/hooks/useAppNavigation';
import { TwitchStream } from '@app/services/twitch-service';
import { elapsedStreamTime } from '@app/utils/string/elapsedStreamTime';
import { formatViewCount } from '@app/utils/string/formatViewCount';
import { useCallback } from 'react';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
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

const styles = StyleSheet.create(theme => ({
  cardWrapper: {
    width: '100%',
  },
  imageWrapper: {
    width: 150,
    height: 100,
    overflow: 'hidden',
    borderRadius: 8,
  },
  image: {
    width: 150,
    height: 100,
    borderRadius: 8,
  },
  container: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.md,
    alignItems: 'flex-start',
  },
  imageContainer: {
    width: 150,
    height: 100,
    flexShrink: 0,
    marginRight: theme.spacing.md,
    overflow: 'hidden',
    borderRadius: 8,
  },
  redDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ff4444',
  },
  details: {
    flex: 1,
    flexShrink: 1,
    justifyContent: 'flex-start',
    gap: theme.spacing.xs,
    minWidth: 0,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metadataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.xs,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  liveText: {
    color: theme.colors.gray.textLow,
  },
  usernameButton: {
    flex: 1,
    minWidth: 0,
  },
  username: {
    fontWeight: '600',
    color: theme.colors.gray.text,
  },
  viewersBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 68, 68, 0.08)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 4,
  },
  viewersDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#ff4444',
  },
  viewersText: {
    color: '#e57373',
    fontWeight: '500',
  },
  categoryBadge: {
    alignSelf: 'flex-start',
  },
  categoryText: {
    color: theme.colors.gray.textLow,
    fontWeight: '400',
  },
  title: {
    color: theme.colors.gray.textLow,
    marginTop: theme.spacing.xs,
    lineHeight: 18,
  },
}));
