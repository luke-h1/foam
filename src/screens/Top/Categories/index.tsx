import CategoryCard from '@app/components/CategoryCard';
import twitchQueries from '@app/queries/twitchQueries';
import { Category } from '@app/services/twitchService';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { FlatList, RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';

const TopCategoriesScreen = () => {
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
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            // tintColor={colors.gray500}
            // colors={[colors.gray500]}
          />
        }
      >
        <View
          style={{
            alignItems: 'center',
            flex: 1,
            justifyContent: 'center',
          }}
        >
          <Feather
            name="info"
            size={24}
            color="$color"
            style={{
              marginRight: 10,
            }}
          />
          <Text>
            {isError ? 'error fetching categories' : 'No categories found'}
          </Text>
        </View>
      </ScrollView>
    );
  }

  if (isLoading || refreshing) {
    return (
      <View
        style={{
          flexDirection: 'row',
        }}
      >
        Loading...
      </View>
    );
  }

  return (
    <SafeAreaView>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View>
          {categories.length > 0 && (
            <FlatList<Category>
              data={categories}
              renderItem={({ item }) => <CategoryCard category={item} />}
              keyExtractor={(_item, index) => index.toString()}
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
export default TopCategoriesScreen;