/* eslint-disable no-underscore-dangle */
/* eslint-disable @typescript-eslint/no-unused-vars */
import LiveStreamCard from '@app/components/LiveStreamCard';
import twitchQueries from '@app/queries/twitchQueries';
import { Stream } from '@app/services/twitchService';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { FlatList, Text, View } from 'react-native';

export default function TopStreamsScreen() {
  const [refreshing, _setRefreshing] = useState(false);
  const _queryClient = useQueryClient();
  const topStreamQuery = useMemo(() => twitchQueries.getTopStreams(), []);

  // const onRefresh = async () => {
  //   setRefreshing(true);
  //   await queryClient.refetchQueries({
  //     queryKey: topStreamQuery.queryKey,
  //   });

  //   setRefreshing(false);
  // };

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
    // eslint-disable-next-line react/jsx-no-useless-fragment
    <>
      {streams && streams.length > 0 && (
        <FlatList<Stream>
          data={streams}
          renderItem={({ item }) => <LiveStreamCard stream={item} />}
          keyExtractor={item => item.id}
        />
      )}
    </>
  );
}
