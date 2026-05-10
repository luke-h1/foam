import { CategoryScreen } from '@app/screens/CategoryScreen';
import { useLocalSearchParams } from 'expo-router';

export default function CategoryRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return <CategoryScreen id={id} />;
}
