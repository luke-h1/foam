import { useAppNavigation, useStreamerImage } from '@app/hooks';
import { Stream } from '@app/services';
import { elapsedStreamTime, formatViewCount } from '@app/utils';
import { View } from 'react-native';
import { createStyleSheet, useStyles } from 'react-native-unistyles';
import { Button } from '../Button';
import { Image } from '../Image';
import { Typography } from '../Typography';

interface Props {
  stream: Stream;
}

export function LiveStreamCard({ stream }: Props) {
  const { styles } = useStyles(stylesheet);
  const { navigate } = useAppNavigation();

  const { profilePicture } = useStreamerImage(stream.user_login, [stream]);

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
            <Typography style={styles.liveText} size="xxs">
              {elapsedStreamTime(stream.started_at)}
            </Typography>
          </View>
        </View>
        <View style={styles.details}>
          <Typography size="xs" weight="semiBold">
            {stream.title}
          </Typography>
          <View style={styles.metadata}>
            <View style={styles.info}>
              {profilePicture && (
                <Image
                  source={profilePicture}
                  style={styles.avatar}
                  testID="LiveStreamCard-avatar"
                />
              )}

              <Typography size="xs">{stream.user_name}</Typography>
            </View>
            <Typography size="xxs">
              {formatViewCount(stream.viewer_count)} viewers
            </Typography>
          </View>
          <Typography size="xxs">{stream.game_name}</Typography>
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
