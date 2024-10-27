import { SearchChannelResponse } from '@app/services/twitchService';
import theme from '@app/styles/theme';
import { StyleSheet, View, ViewStyle } from 'react-native';
import LiveStreamImage from './LiveStreamImage';
import Text from './Text';

interface Props {
  stream: SearchChannelResponse;
}

export default function LiveStreamMiniCard({ stream }: Props) {
  return (
    <View style={styles.streamer}>
      <LiveStreamImage
        thumbnail={stream.thumbnail_url}
        animated
        startedAt={stream.started_at}
        size="small"
      />
      <View style={styles.streamerDetails}>
        <Text size="sm" weight="bold">
          {stream.title ?? stream.broadcaster_login}
        </Text>
        <Text size="sm" weight="medium">
          {stream.game_name}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create<{
  streamer: ViewStyle;
  streamerDetails: ViewStyle;
}>({
  streamer: {
    flexDirection: 'row',
    marginBottom: theme.spacing.md,
  },
  streamerDetails: {
    flex: 1,
    justifyContent: 'center',
  },
});
