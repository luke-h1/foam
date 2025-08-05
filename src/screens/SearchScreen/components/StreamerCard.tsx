import { Button, LiveStreamImage, Text } from '@app/components';
import { useAppNavigation } from '@app/hooks';
import type { SearchChannelResponse } from '@app/services';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

interface Props {
  stream: SearchChannelResponse;
}

export function StreamerCard({ stream }: Props) {
  const { navigate } = useAppNavigation();

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
          <Text variant="caption2">{stream.display_name}</Text>
          <Text style={styles.gameName}>{stream.game_name}</Text>
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
