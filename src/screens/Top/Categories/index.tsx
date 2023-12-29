import { AntDesign } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { FlatList, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, Spinner, Stack, Text, XStack } from 'tamagui';
import CategoryCard from '../../../components/ui/CategoryCard';
import twitchQueries from '../../../queries/twitchQueries';
import { Category } from '../../../services/twitchService';
import colors from '../../../styles/colors';

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
            tintColor={colors.gray}
            colors={[colors.gray]}
          />
        }
      >
        <Stack alignItems="center" flex={1} justifyContent="center">
          <AntDesign
            name="infocirlceo"
            size={24}
            color="black"
            style={{
              marginRight: 10,
            }}
          />
          <Text>
            {isError ? 'error fetching categories' : 'No categories found'}
          </Text>
        </Stack>
      </ScrollView>
    );
  }

  if (isLoading) {
    return (
      <Stack flex={1} justifyContent="center" alignItems="center">
        <Spinner color={colors.gray} size="large" />
      </Stack>
    );
  }

  return (
    <SafeAreaView
      style={{
        padding: 2,
      }}
    >
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.gray}
            colors={[colors.gray]}
          />
        }
      >
        <XStack paddingHorizontal="$2" space>
          {categories.length > 0 && (
            <FlatList<Category>
              data={categories}
              renderItem={({ item }) => <CategoryCard category={item} />}
              keyExtractor={(_item, index) => index.toString()}
            />
          )}
        </XStack>
      </ScrollView>
    </SafeAreaView>
  );
};
export default TopCategoriesScreen;
