import { useAppTheme } from '@app/context/ThemeContext';
import { SearchChannelResponse } from '@app/services/twitchService';
import { ThemedStyle } from '@app/theme';
import { StyleSheet, View, ViewStyle } from 'react-native';
import LiveStreamImage from './LiveStreamImage';
import Text from './Text';

interface Props {
  stream: SearchChannelResponse;
}

export default function LiveStreamMiniCard({ stream }: Props) {
  const { themed } = useAppTheme();

  return (
    <View style={themed(streamer)}>
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

const streamer: ThemedStyle<ViewStyle> = theme => ({
  flexDirection: 'row',
  marginBottom: theme.spacing.md,
});

const styles = StyleSheet.create<{
  streamerDetails: ViewStyle;
}>({
  streamerDetails: {
    flex: 1,
    justifyContent: 'center',
  },
});
