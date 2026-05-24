import { ClipPlayerScreen } from '@app/screens/Stream/ClipPlayerScreen';
import { useLocalSearchParams } from 'expo-router';

export default function ClipPlayerRoute() {
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const normalizedId = Array.isArray(id) ? id[0] : id;

  return <ClipPlayerScreen id={normalizedId ?? ''} />;
}
