import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { FlatList, SafeAreaView } from 'react-native';
import { Image, ScrollView, Stack } from 'tamagui';
import { Flex } from '../../components/Flex';
import Main from '../../components/Main';
import StreamCard from '../../components/StreamCard';
import { Text } from '../../components/Text';
import Spinner from '../../components/loading/Spinner';
import {
  CategoryRoutes,
  CategoryStackScreenProps,
} from '../../navigation/Category/CategoryStack';
import twitchQueries from '../../queries/twitchQueries';
import { iconSizes } from '../../styles';

const CategoryScreen = ({
  route,
}: CategoryStackScreenProps<CategoryRoutes.Category>) => {
  const { id } = route.params;

  const streamsByCategoryQuery = useMemo(
    () => twitchQueries.getStreamsByCategory(id),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const categoryQuery = useMemo(
    () => twitchQueries.getCategory(id),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const {
    data: category,
    isLoading: isLoadingCategory,
    isError: isErrorCategory,
  } = useQuery(categoryQuery);
  const {
    data: streams,
    isLoading: isLoadingStreams,
    isError: isErrorStreams,
  } = useQuery(streamsByCategoryQuery);

  if (isLoadingCategory || isLoadingStreams) {
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

  if (isErrorCategory || isErrorStreams) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          flexDirection: 'column',
        }}
      >
        <Main>
          <Text>Something went wrong</Text>
        </Main>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={{
        flex: 1,
        flexDirection: 'column',
      }}
    >
      <ScrollView>
        <Main>
          <Stack
            display="flex"
            flexDirection="row"
            alignItems="stretch"
            marginBottom={10}
          >
            <Image
              source={{
                uri: category?.box_art_url
                  .replace('{width}', '100')
                  .replace('{height}', '135'),
              }}
              width={100}
              height={135}
            />
            <Text marginLeft={8} variant="heading3">
              {category?.name}
            </Text>
          </Stack>
          <Stack marginTop={20}>
            <FlatList
              data={streams}
              renderItem={({ item }) => <StreamCard stream={item} />}
              keyExtractor={item => item.id}
            />
          </Stack>
        </Main>
      </ScrollView>
    </SafeAreaView>
  );
};
export default CategoryScreen;
