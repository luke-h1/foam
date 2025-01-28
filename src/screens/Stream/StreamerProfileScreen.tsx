import { Typography } from '@app/components';
import { useHeader } from '@app/hooks';
import { View } from 'react-native';

export function StreamerProfileScreen() {
  useHeader({
    title: 'Streamer profile',
  });
  return (
    <View>
      <Typography>Streamer profile</Typography>
    </View>
  );
}
