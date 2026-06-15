import { VodPlayerScreen } from '@app/screens/Stream/VodPlayerScreen';
import { useLocalSearchParams } from 'expo-router';

export default function VodPlayerRoute() {
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const normalizedId = Array.isArray(id) ? id[0] : id;

  return <VodPlayerScreen id={normalizedId ?? ''} />;
}
