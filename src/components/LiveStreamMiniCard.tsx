import { RootRoutes, RootStackParamList } from '@app/navigation/RootStack';
import { StreamRoutes } from '@app/navigation/Stream/StreamStack';
import { SearchChannelResponse } from '@app/services/twitchService';
import theme from '@app/styles/theme';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import LiveStreamImage from './LiveStreamImage';
import ThemedText from './ThemedText';

interface Props {
  stream: SearchChannelResponse;
}

export default function LiveStreamMiniCard({ stream }: Props) {
  const { navigate } = useNavigation<NavigationProp<RootStackParamList>>();

  return (
    <TouchableOpacity
      onPress={() => {
        navigate(RootRoutes.Stream, {
          screen: StreamRoutes.LiveStream,
          params: {
            id: stream.broadcaster_login,
          },
        });
      }}
    >
      <View style={styles.streamer}>
        <LiveStreamImage
          thumbnail={stream.thumbnail_url}
          animated
          startedAt={stream.started_at}
          size="small"
        />
        <View style={styles.streamerDetails}>
          <Text>{stream.display_name}</Text>
          <ThemedText fontSize={theme.fontSize.xs} fontWeight="medium">
            {stream.game_name}
          </ThemedText>
        </View>
      </View>
    </TouchableOpacity>
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
    justifyContent: 'center',
  },
});
