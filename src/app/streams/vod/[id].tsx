import { useLocalSearchParams } from 'expo-router';

import { VodPlayerScreen } from '@app/screens/Stream/VodPlayerScreen';

export default function VodPlayerRoute() {
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const normalizedId = Array.isArray(id) ? id[0] : id;

  return <VodPlayerScreen id={normalizedId ?? ''} />;
}
