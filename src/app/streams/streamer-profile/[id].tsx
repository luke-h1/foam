import { useLocalSearchParams } from 'expo-router';

import { StreamerProfileScreen } from '@app/screens/stream/StreamerProfileScreen';

export default function StreamerProfileRoute() {
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const normalizedId = Array.isArray(id) ? id[0] : id;

  return <StreamerProfileScreen id={normalizedId ?? ''} />;
}
