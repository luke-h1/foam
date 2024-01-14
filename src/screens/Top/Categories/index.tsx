import { Info } from '@tamagui/lucide-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { FlatList, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, Stack, XStack } from 'tamagui';
import CategoryCard from '../../../components/CategoryCard';
import { Flex } from '../../../components/Flex';
import { Text } from '../../../components/Text';
import Spinner from '../../../components/loading/Spinner';
import twitchQueries from '../../../queries/twitchQueries';
import { Category } from '../../../services/twitchService';
import { colors, iconSizes } from '../../../styles';

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
            tintColor={colors.gray500}
            colors={[colors.gray500]}
          />
        }
      >
        <Stack alignItems="center" flex={1} justifyContent="center">
          <Info
            size={24}
            color="$color"
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

  if (isLoading || refreshing) {
    return (
      <Flex
        centered
        row
        flexDirection="row"
        gap="$spacing4"
        marginTop="$spacing60"
        padding="$spacing4"
      >
        <Spinner color="$neutral3" size={iconSizes.icon64} />
      </Flex>
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
            tintColor={colors.gray500}
            colors={[colors.gray500]}
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
