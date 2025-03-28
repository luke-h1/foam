import { useAppNavigation, useStreamerImage } from '@app/hooks';
import { Stream } from '@app/services';
import { elapsedStreamTime, formatViewCount } from '@app/utils';
import { Image } from 'expo-image';
import { View } from 'react-native';
import { createStyleSheet, useStyles } from 'react-native-unistyles';
import { Button } from '../Button';
import { Typography } from '../Typography';
import { LiveStreamCardSkeleton } from './LiveStreamCardSkeleton';

interface Props {
  stream: Stream;
}

export function LiveStreamCard({ stream }: Props) {
  const { styles } = useStyles(stylesheet);
  const { navigate } = useAppNavigation();

  const { profilePicture } = useStreamerImage(stream.user_login, [stream]);

  if (!stream) {
    return <LiveStreamCardSkeleton />;
  }

  return (
    <Button
      onPress={() => {
        navigate('Streams', {
          screen: 'LiveStream',
          params: {
            id: stream.user_login,
          },
        });
      }}
    >
      <View style={styles.container}>
        <View style={styles.imageContainer}>
          {stream.thumbnail_url && (
            <Image
              source={stream.thumbnail_url
                .replace('{width}', '720')
                .replace('{height}', '480')}
              style={{
                width: 150,
                height: 100,
              }}
            />
          )}

          <View style={styles.overlay}>
            <View style={styles.redDot} />
            <Typography style={styles.liveText}>
              {elapsedStreamTime(stream.started_at)}
            </Typography>
          </View>
        </View>
        <View style={styles.details}>
          <Typography size="sm" weight="semiBold">
            {stream.title}
          </Typography>
          <View style={styles.metadata}>
            <View style={styles.info}>
              {profilePicture && (
                <Image
                  source={{ uri: profilePicture }}
                  style={styles.avatar}
                  testID="LiveStreamCard-avatar"
                />
              )}

              <Typography> {stream.user_name}</Typography>
            </View>
            <Typography size="xs">
              {formatViewCount(stream.viewer_count)} viewers
            </Typography>
          </View>
          <Typography size="xs">{stream.game_name}</Typography>
        </View>
      </View>
    </Button>
  );
}

const stylesheet = createStyleSheet(theme => ({
  container: {
    flexDirection: 'row',
    paddingVertical: theme.spacing.xl,
    paddingHorizontal: theme.spacing.sm,
    marginBottom: theme.spacing.md,
    columnGap: theme.spacing.sm,
    flex: 1,
    // borderBottomWidth: 1.25,
  },
  tagWrapper: {
    width: '85%',
  },
  imageContainer: {
    position: 'relative',
  },
  overlay: {
    position: 'absolute',
    top: 3,
    left: 3,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 5,
  },
  redDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'red',
    marginRight: 5,
  },
  liveText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  details: {
    flex: 1,
    justifyContent: 'flex-start',
    marginLeft: theme.spacing.md,
  },
  title: {
    fontWeight: 'bold',
  },
  metadata: {
    marginVertical: theme.spacing.sm,
  },
  info: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: theme.spacing.md,
  },
  avatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: theme.spacing.xs,
  },
  tagsContainer: {
    marginTop: theme.spacing.xs,
  },
}));
