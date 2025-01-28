import { useAppNavigation } from '@app/hooks';
import { Stream, twitchService } from '@app/services';
import { elapsedStreamTime } from '@app/utils';
import React, { useEffect, useState } from 'react';
import { View, Image } from 'react-native';
import { createStyleSheet, useStyles } from 'react-native-unistyles';
import { Button } from '../Button';
import { Tags } from '../Tags';
import { Typography } from '../Typography';

interface Props {
  stream: Stream;
}

export function StreamStackCard({ stream }: Props) {
  const [broadcasterImage, setBroadcasterImage] = useState<string>();
  const { navigate } = useAppNavigation();
  const { styles, theme } = useStyles(stylesheet);

  const getUserProfilePictures = async () => {
    const res = await twitchService.getUserImage(stream.user_login);
    setBroadcasterImage(res);
  };

  useEffect(() => {
    getUserProfilePictures();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stream]);

  return (
    <Button
      style={styles.container}
      onPress={() => {
        navigate('Streams', {
          screen: 'LiveStream',
          params: {
            id: stream.user_login,
          },
        });
      }}
    >
      <View style={styles.wrapper}>
        <View style={styles.imageContainer}>
          <Image
            source={{
              uri: stream.thumbnail_url
                .replace('{width}', '1080')
                .replace('{height}', '1200'),
            }}
            style={styles.streamImage}
          />
          <View style={styles.overlay}>
            <View style={styles.redDot} />
            <Typography style={styles.uptime}>
              {elapsedStreamTime(stream.started_at)}
            </Typography>
          </View>
        </View>
        <View style={styles.content}>
          <Typography style={styles.title}>{stream.title}</Typography>
          <Typography style={styles.category}>{stream.game_name}</Typography>
          <Typography style={styles.viewers}>
            {new Intl.NumberFormat('en-US').format(stream.viewer_count)} viewers{' '}
          </Typography>
          <View style={styles.userInfo}>
            {broadcasterImage && (
              <Image
                source={{ uri: broadcasterImage }}
                style={styles.userImage}
              />
            )}
            <Typography style={styles.userName}>{stream.user_name}</Typography>
          </View>
        </View>
        <View
          style={{ marginTop: theme.spacing.xs, padding: theme.spacing.xs }}
        >
          <Tags tags={stream.tags} />
        </View>
      </View>
    </Button>
  );
}

const stylesheet = createStyleSheet(theme => ({
  wrapper: {
    borderColor: theme.colors.borderFaint,
    borderStyle: 'solid',
    borderRadius: 8,
    borderWidth: 1,
    padding: 2,
  },
  container: {
    flexDirection: 'column',
    marginBottom: 15,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: theme.colors.borderFaint,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.6,
    shadowRadius: 1,
  },
  imageContainer: {
    position: 'relative',
  },
  streamImage: {
    width: '100%',
    height: 150,
    resizeMode: 'stretch',
  },
  overlay: {
    position: 'absolute',
    top: 5,
    left: 5,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  redDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'red',
    marginRight: 4,
  },
  uptime: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  content: {
    padding: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  category: {
    fontSize: 12,
    marginBottom: 4,
  },
  viewers: {
    fontSize: 12,
    marginBottom: 8,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userImage: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 8,
  },
  userName: {
    fontSize: 12,
    fontWeight: 'bold',
  },
}));
