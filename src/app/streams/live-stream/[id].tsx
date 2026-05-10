import { LiveStreamScreen } from '@app/screens/Stream/LiveStreamScreen';
import { useLocalSearchParams } from 'expo-router';

export default function LiveStreamRoute() {
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const normalizedId = Array.isArray(id) ? id[0] : id;

  return <LiveStreamScreen id={normalizedId ?? ''} />;
}
