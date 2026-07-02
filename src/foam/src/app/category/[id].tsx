import { useLocalSearchParams } from 'expo-router';

import { CategoryScreen } from '@app/screens/CategoryScreen';

export default function CategoryRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return <CategoryScreen id={id} />;
}
