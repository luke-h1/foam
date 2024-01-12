import { AntDesign } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { FlatList, RefreshControl, SafeAreaView } from 'react-native';
import { ScrollView, Spinner, Stack, Text, XStack } from 'tamagui';
import StreamCard from '../../../components/ui/StreamCard';
import twitchQueries from '../../../queries/twitchQueries';
import { Stream } from '../../../services/twitchService';

const TopStreamsScreen = () => {
  const [refreshing, setRefreshing] = useState(false);
  const queryClient = useQueryClient();
  const topStreamQuery = useMemo(() => twitchQueries.getTopStreams(), []);

  const onRefresh = async () => {
    setRefreshing(true);
    await queryClient.refetchQueries({
      queryKey: topStreamQuery.queryKey,
    });

    setRefreshing(false);
  };

  const { data: streams, isLoading, isError } = useQuery(topStreamQuery);

  if ((!isLoading && !streams?.length) || isError) {
    return (
      <Stack
        display="flex"
        justifyContent="center"
        alignItems="center"
        flex={1}
      >
        <Stack display="flex" flexDirection="row" alignItems="center">
          <AntDesign
            name="infocirlceo"
            size={24}
            color="black"
            style={{
              marginRight: 10,
            }}
          />
          <Text>No streams found</Text>
        </Stack>
      </Stack>
    );
  }

  if (refreshing || isLoading) {
    return <Spinner color="$color" size="large" />;
  }

  return (
    <SafeAreaView>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            // tintColor={colors.gray}
            // colors={[colors.gray]}
          />
        }
      >
        <Stack marginTop={20} />
        <Stack>
          <XStack
            $sm={{ flexDirection: 'column' }}
            paddingHorizontal="$2"
            space
          >
            {streams && streams.length > 0 && (
              <FlatList<Stream>
                data={streams}
                renderItem={({ item }) => <StreamCard stream={item} />}
                keyExtractor={item => item.id}
              />
            )}
          </XStack>
        </Stack>
      </ScrollView>
    </SafeAreaView>
  );
};
export default TopStreamsScreen;
