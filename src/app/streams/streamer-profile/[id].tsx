import { useLocalSearchParams } from 'expo-router';

import { StreamerProfileScreen } from '@app/screens/Stream/StreamerProfileScreen';

export default function StreamerProfileRoute() {
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const normalizedId = Array.isArray(id) ? id[0] : id;

  return <StreamerProfileScreen id={normalizedId ?? ''} />;
}
