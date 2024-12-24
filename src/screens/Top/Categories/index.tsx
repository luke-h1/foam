import CategoryCard from '@app/components/CategoryCard';
import EmptyState from '@app/components/ui/EmptyState';
import Screen from '@app/components/ui/Screen';
import Spinner from '@app/components/ui/Spinner';
import twitchQueries from '@app/queries/twitchQueries';
import { Category } from '@app/services/twitchService';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { FlatList, RefreshControl } from 'react-native';

export default function CategoriesSecreen() {
  const [refreshing, setRefreshing] = useState(false);
  const queryClient = useQueryClient();

  const topCategoriesQuery = useMemo(
    () => twitchQueries.getTopCategories(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const { data: categories, isLoading, isError } = useQuery(topCategoriesQuery);

  const onRefresh = async () => {
    setRefreshing(true);
    await queryClient.refetchQueries({
      queryKey: topCategoriesQuery.queryKey,
    });
    setRefreshing(false);
  };

  if (!categories || isError) {
    return (
      <EmptyState
        content="No categories found"
        buttonOnPress={() => onRefresh()}
      />
    );
  }

  if (isLoading || refreshing) {
    return <Spinner />;
  }

  return (
    <Screen
      preset="scroll"
      ScrollViewProps={{
        refreshControl: (
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        ),
      }}
    >
      <FlatList<Category>
        data={categories}
        renderItem={({ item }) => <CategoryCard category={item} />}
        keyExtractor={(_item, index) => index.toString()}
        onRefresh={onRefresh}
        refreshing={refreshing}
      />
    </Screen>
  );
}
