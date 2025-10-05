import { LiveStreamScreen } from '@app/screens';
import { useLocalSearchParams } from 'expo-router';

export default function LiveScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <LiveStreamScreen id={id} />;
}
