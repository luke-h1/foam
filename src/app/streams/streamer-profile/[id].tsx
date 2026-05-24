import { StreamerProfileScreen } from '@app/screens/Stream/StreamerProfileScreen';
import { useLocalSearchParams } from 'expo-router';

export default function StreamerProfileRoute() {
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const normalizedId = Array.isArray(id) ? id[0] : id;

  return <StreamerProfileScreen id={normalizedId ?? ''} />;
}
