import { RootRoutes, RootStackParamList } from '@app/navigation/RootStack';
import { StreamRoutes } from '@app/navigation/Stream/StreamStack';
import { SearchChannelResponse } from '@app/services/twitchService';
import { spacing } from '@app/styles';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { StyleSheet, TouchableOpacity, View, ViewStyle } from 'react-native';
import LiveStreamImage from './LiveStreamImage';
import { Text } from './ui/Text';

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
          <Text>{stream.game_name}</Text>
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
    marginBottom: spacing.medium,
  },
  streamerDetails: {
    justifyContent: 'center',
  },
});
