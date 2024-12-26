import useAppNavigation from '@app/hooks/useAppNavigation';
import { SearchChannelResponse } from '@app/services/twitchService';
import { spacing } from '@app/styles';
import { TouchableOpacity, View, ViewStyle } from 'react-native';
import LiveStreamImage from '../../../components/LiveStreamImage';
import { Text } from '../../../components/ui/Text';

interface Props {
  stream: SearchChannelResponse;
}

export default function StreamerCard({ stream }: Props) {
  const { navigate } = useAppNavigation();

  return (
    <TouchableOpacity
      onPress={() => {
        navigate('Streams', {
          screen: 'LiveStream',
          params: {
            id: stream.broadcaster_login,
          },
        });
      }}
    >
      <View style={$streamer}>
        <LiveStreamImage
          thumbnail={stream.thumbnail_url}
          animated
          size="small"
        />
        <View style={$streamerDetails}>
          <Text>{stream.display_name}</Text>
          <Text>{stream.game_name}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const $streamer: ViewStyle = {
  flexDirection: 'row',
  marginBottom: spacing.medium,
};

const $streamerDetails: ViewStyle = {
  justifyContent: 'center',
};
