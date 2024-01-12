import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { FlatList, SafeAreaView } from 'react-native';
import { H3, Image, ScrollView, Spinner, Stack, Text } from 'tamagui';
import Main from '../../components/ui/Main';
import StreamCard from '../../components/ui/StreamCard';
import {
  CategoryRoutes,
  CategoryStackScreenProps,
} from '../../navigation/Category/CategoryStack';
import twitchQueries from '../../queries/twitchQueries';

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
      <SafeAreaView
        style={{
          flex: 1,
          flexDirection: 'column',
        }}
      >
        <Main>
          <Spinner size="large" />
        </Main>
      </SafeAreaView>
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
            <H3 marginLeft={8} color="$color">
              {category?.name}
            </H3>
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
