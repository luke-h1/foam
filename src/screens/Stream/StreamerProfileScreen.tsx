import { Text } from '@app/components/ui/Text';
import useHeader from '@app/hooks/useHeader';
import { View } from 'react-native';

export default function StreamerProfileScreen() {
  useHeader({
    title: 'Streamer profile',
  });
  return (
    <View>
      <Text>Streamer profile</Text>
    </View>
  );
}
