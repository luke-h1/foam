import { Flex } from '@app/components/Flex';
import Main from '@app/components/Main';
import StreamCard from '@app/components/StreamCard';
import { Text } from '@app/components/Text';
import Spinner from '@app/components/loading/Spinner';
import {
  CategoryRoutes,
  CategoryStackScreenProps,
} from '@app/navigation/Category/CategoryStack';
import twitchQueries from '@app/queries/twitchQueries';
import { iconSizes } from '@app/styles';
import { useQueries } from '@tanstack/react-query';
import { FlatList, SafeAreaView } from 'react-native';
import { Image, ScrollView, Stack } from 'tamagui';

const CategoryScreen = ({
  route,
}: CategoryStackScreenProps<CategoryRoutes.Category>) => {
  const { id } = route.params;

  const [categoryQueryResult, streamsByCategoryQueryResult] = useQueries({
    queries: [
      twitchQueries.getCategory(id),
      twitchQueries.getStreamsByCategory(id),
    ],
  });
  const {
    data: category,
    isLoading: isLoadingCategory,
    isError: isErrorCategory,
  } = categoryQueryResult;

  const {
    data: streams,
    isLoading: isLoadingStreams,
    isError: isErrorStreams,
  } = streamsByCategoryQueryResult;

  if (isLoadingCategory || isLoadingStreams) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          flexDirection: 'column',
        }}
      >
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
