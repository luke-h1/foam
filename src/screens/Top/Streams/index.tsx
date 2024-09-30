import StreamCard from '@app/components/StreamCard';
import twitchQueries from '@app/queries/twitchQueries';
import { Stream } from '@app/services/twitchService';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  Text,
  View,
} from 'react-native';

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
      <View
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          flex: 1,
        }}
      >
        <View
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <Text>No streams found</Text>
        </View>
      </View>
    );
  }

  if (refreshing || isLoading) {
    return (
      <View>
        <Text>loading...</Text>
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
          {streams && streams.length > 0 && (
            <FlatList<Stream>
              data={streams}
              renderItem={({ item }) => <StreamCard stream={item} />}
              keyExtractor={item => item.id}
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
export default TopStreamsScreen;
