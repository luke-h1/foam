import { Button, LiveStreamImage, Typography } from '@app/components';
import { useAppNavigation } from '@app/hooks';
import type { SearchChannelResponse } from '@app/services';
import { View } from 'react-native';
import { createStyleSheet, useStyles } from 'react-native-unistyles';

interface Props {
  stream: SearchChannelResponse;
}

export function StreamerCard({ stream }: Props) {
  const { navigate } = useAppNavigation();
  const { styles } = useStyles(stylesheet);

  return (
    <Button
      onPress={() => {
        navigate('Streams', {
          screen: 'LiveStream',
          params: {
            id: stream.broadcaster_login,
          },
        });
      }}
    >
      <View style={styles.streamer}>
        <LiveStreamImage thumbnail={stream.thumbnail_url} animated size="sm" />
        <View>
          <Typography>{stream.display_name}</Typography>
          <Typography size="xs" style={styles.gameName}>
            {stream.game_name}
          </Typography>
        </View>
      </View>
    </Button>
  );
}

const stylesheet = createStyleSheet(theme => ({
  streamer: {
    flexDirection: 'row',
    marginBottom: theme.spacing.sm,
  },
  gameName: {
    marginTop: theme.spacing.md,
  },
}));
