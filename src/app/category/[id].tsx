import { useLocalSearchParams } from 'expo-router';

import { CategoryScreen } from '@app/screens/category/category-screen';

export default function CategoryRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return <CategoryScreen id={id} />;
}
