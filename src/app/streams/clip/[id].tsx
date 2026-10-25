import { useLocalSearchParams } from 'expo-router';

import { ClipPlayerScreen } from '@app/screens/stream/ClipPlayerScreen';

export default function ClipPlayerRoute() {
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const normalizedId = Array.isArray(id) ? id[0] : id;

  return <ClipPlayerScreen id={normalizedId ?? ''} />;
}
