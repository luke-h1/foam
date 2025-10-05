import { CategoryScreen } from '@app/screens';
import { useLocalSearchParams } from 'expo-router';

export default function CategoryView() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <CategoryScreen id={id} />;
}
