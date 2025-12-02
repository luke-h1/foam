import { useAppNavigation } from '@app/hooks';
import { TwitchStream } from '@app/services/twitch-service';
import { elapsedStreamTime, formatViewCount } from '@app/utils';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Button } from '../Button';
import { Image } from '../Image';
import { Typography } from '../Typography';

interface Props {
  stream: TwitchStream;
}

export function LiveStreamCard({ stream }: Props) {
  const { navigate } = useAppNavigation();
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
          <Image
            source={stream?.thumbnail_url
              .replace('{width}', '1920')
              .replace('{height}', '1080')}
            // eslint-disable-next-line react-native/no-inline-styles
            style={{
              width: 150,
              height: 100,
            }}
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
          <View style={styles.metadata}>
            <View style={styles.info}>
              <Image
                source={stream.profilePicture}
                style={styles.avatar}
                testID="LiveStreamCard-avatar"
              />
              <Typography size="xs">{stream.user_name}</Typography>
            </View>
            <Typography size="xxs" style={styles.viewers}>
              {formatViewCount(stream.viewer_count)} viewers
            </Typography>
          </View>
          <Typography size="xxs">{stream.game_name}</Typography>
          <Typography size="sm">{stream.title}</Typography>
        </View>
      </View>
    </Button>
  );
}

const styles = StyleSheet.create(theme => ({
  container: {
    flexDirection: 'row',
    paddingVertical: theme.spacing.xl,
    paddingHorizontal: theme.spacing.sm,
    marginBottom: theme.spacing.md,
    columnGap: theme.spacing.sm,
    flex: 1,
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
    borderCurve: 'continuous',
  },
  redDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'red',
    marginRight: 5,
  },
  liveText: {},
  details: {
    flex: 1,
    justifyContent: 'flex-start',
    marginLeft: theme.spacing.sm,
  },
  viewers: {},
  title: {},
  metadata: {
    marginVertical: theme.spacing.sm,
  },
  info: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  avatar: {
    width: 20,
    height: 20,
    borderRadius: theme.spacing.lg,
    marginRight: theme.spacing.sm,
  },
  tagsContainer: {
    marginTop: theme.spacing.xs,
  },
}));
