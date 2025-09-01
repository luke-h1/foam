import { useStreamerImage } from '@app/hooks';
import { Stream } from '@app/services';
import { elapsedStreamTime, formatViewCount } from '@app/utils';
import { useRouter } from 'expo-router';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Button } from '../Button';
import { Image } from '../Image';
import { Typography } from '../Typography';

interface Props {
  stream: Stream;
}

export function LiveStreamCard({ stream }: Props) {
  const { profilePicture } = useStreamerImage(stream.user_login, [stream]);

  const router = useRouter();

  return (
    <Button
      onPress={() => {
        router.push(`/streams/${stream.id}`);
      }}
    >
      <View style={styles.container}>
        <View style={styles.imageContainer}>
          <Image
            source={stream?.thumbnail_url
              .replace('{width}', '1920')
              .replace('{height}', '1080')}
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
          <Typography size="sm">{stream.title}</Typography>
          <View style={styles.metadata}>
            <View style={styles.info}>
              <Image
                source={profilePicture}
                style={styles.avatar}
                testID="LiveStreamCard-avatar"
              />

              <Typography size="xs">{stream.user_name}</Typography>
            </View>
            <Typography size="xxs">
              {formatViewCount(stream.viewer_count)} viewers
            </Typography>
          </View>
          <Typography size="sm">{stream.game_name}</Typography>
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
  },
  redDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'red',
    marginRight: 5,
  },
  liveText: {
    // color: 'white',
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
