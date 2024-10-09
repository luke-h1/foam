import StreamCard from '@app/components/StreamCard';
import {
  CategoryRoutes,
  CategoryStackScreenProps,
} from '@app/navigation/Category/CategoryStack';
import twitchQueries from '@app/queries/twitchQueries';
import { useQueries } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { FlatList, SafeAreaView, Text, View } from 'react-native';

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
        <View>Loading...</View>
      </SafeAreaView>
    );
  }

  if (isErrorCategory || isErrorStreams) {
    return <View>Something went wrong :(</View>;
  }

  return (
    <View>
      <View
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'stretch',
          marginBottom: 10,
        }}
      >
        <Image
          source={{
            uri: category?.box_art_url
              .replace('{width}', '100')
              .replace('{height}', '135'),
          }}
          style={{
            width: 100,
            height: 135,
          }}
        />
        <Text>{category?.name}</Text>
      </View>
      <View>
        <FlatList
          data={streams}
          renderItem={({ item }) => <StreamCard stream={item} />}
          keyExtractor={item => item.id}
        />
      </View>
    </View>
  );
};
export default CategoryScreen;
