import { Button, LiveStreamImage, Typography } from '@app/components';
import { SearchChannelResponse } from '@app/services/twitch-service';
import { useRouter } from 'expo-router';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

interface Props {
  stream: SearchChannelResponse;
}

export function StreamerCard({ stream }: Props) {
  const router = useRouter();

  return (
    <Button
      onPress={() => {
        router.push(`/streams/live/${stream.broadcaster_login}`);
      }}
    >
      <View style={styles.streamer}>
        <LiveStreamImage thumbnail={stream.thumbnail_url} animated size="sm" />
        <View>
          <Typography>{stream.display_name}</Typography>
          <Typography style={styles.gameName}>{stream.game_name}</Typography>
        </View>
      </View>
    </Button>
  );
}

const styles = StyleSheet.create(theme => ({
  streamer: {
    flexDirection: 'row',
    marginBottom: theme.spacing.sm,
  },
  gameName: {
    marginTop: theme.spacing.md,
  },
}));
