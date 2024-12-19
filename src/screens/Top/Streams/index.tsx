/* eslint-disable no-underscore-dangle */
/* eslint-disable @typescript-eslint/no-unused-vars */
import LiveStreamCard from '@app/components/LiveStreamCard';
import EmptyState from '@app/components/ui/EmptyState';
import Spinner from '@app/components/ui/Spinner';
import twitchQueries from '@app/queries/twitchQueries';
import { Stream } from '@app/services/twitchService';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { FlatList, SafeAreaView, Text, View } from 'react-native';

export default function TopStreamsScreen() {
  const [refreshing, _setRefreshing] = useState<boolean>(false);
  const topStreamQuery = useMemo(() => twitchQueries.getTopStreams(), []);

  // const onRefresh = async () => {
  //   setRefreshing(true);
  //   await queryClient.refetchQueries({
  //     queryKey: topStreamQuery.queryKey,
  //   });

  //   setRefreshing(false);
  // };

  const { data: streams, isLoading, isError } = useQuery(topStreamQuery);

  if (refreshing) {
    return <Spinner />;
  }

  if (streams && streams.length > 0) {
    return (
      <FlatList<Stream>
        data={streams}
        renderItem={({ item }) => <LiveStreamCard stream={item} />}
        keyExtractor={item => item.id}
      />
    );
  }

  return <EmptyState />;
}
