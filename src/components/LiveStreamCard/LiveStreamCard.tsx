import { useAppNavigation } from '@app/hooks/useAppNavigation';
import { TwitchStream } from '@app/services/twitch-service';
import { elapsedStreamTime } from '@app/utils/string/elapsedStreamTime';
import { formatViewCount } from '@app/utils/string/formatViewCount';
import { useCallback } from 'react';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Button } from '../Button';
import { Image } from '../Image';
import { PressableArea } from '../PressableArea';
import { Typography } from '../Typography';

interface Props {
  stream: TwitchStream;
}

export function LiveStreamCard({ stream }: Props) {
  const navigation = useAppNavigation();

  const handleStreamPressIn = useCallback(() => {
    navigation.preload('Streams', {
      screen: 'LiveStream',
      params: { id: stream.user_login },
    });
  }, [navigation, stream.user_login]);

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
    <Button onPress={handleStreamPress} onPressIn={handleStreamPressIn}>
      <View style={styles.container}>
        <View style={styles.imageContainer}>
          <Image
            source={stream?.thumbnail_url
              .replace('{width}', '1920')
              .replace('{height}', '1080')}
            style={styles.image}
            transition={150}
          />
          <View style={styles.overlay}>
            <View style={styles.redDot} />
            <Typography size="xxs">
              {elapsedStreamTime(stream.started_at)}
            </Typography>
          </View>
        </View>
        <View style={styles.details}>
          <View style={styles.headerRow}>
            <PressableArea
              onPress={handleStreamerPress}
              onPressIn={handleStreamerPressIn}
              style={styles.usernameButton}
              hitSlop={8}
            >
              <Typography size="sm" style={styles.username}>
                {stream.user_name}
              </Typography>
            </PressableArea>
            <View style={styles.viewersBadge}>
              <View style={styles.viewersDot} />
              <Typography size="xxs" style={styles.viewersText}>
                {formatViewCount(stream.viewer_count)}
              </Typography>
            </View>
          </View>
          <PressableArea
            onPress={handleCategoryPress}
            style={styles.categoryBadge}
            hitSlop={4}
          >
            <Typography size="xxs" style={styles.categoryText}>
              {stream.game_name}
            </Typography>
          </PressableArea>
          <Typography size="xs" style={styles.title} numberOfLines={2}>
            {stream.title}
          </Typography>
        </View>
      </View>
    </Button>
  );
}

const styles = StyleSheet.create(theme => ({
  image: {
    width: 150,
    height: 100,
    borderRadius: 8,
  },
  container: {
    flexDirection: 'row',
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
    columnGap: theme.spacing.md,
    flex: 1,
  },
  imageContainer: {
    position: 'relative',
  },
  overlay: {
    position: 'absolute',
    top: 6,
    left: 6,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderCurve: 'continuous',
  },
  redDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ff4444',
    marginRight: 5,
  },
  details: {
    flex: 1,
    justifyContent: 'flex-start',
    gap: theme.spacing.xs,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  usernameButton: {
    flex: 1,
  },
  username: {
    fontWeight: '600',
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
    opacity: 0.85,
    marginTop: theme.spacing.xs,
    lineHeight: 18,
  },
}));
