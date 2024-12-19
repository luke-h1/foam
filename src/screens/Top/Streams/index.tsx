/* eslint-disable no-underscore-dangle */
/* eslint-disable @typescript-eslint/no-unused-vars */
import LiveStreamCard from '@app/components/LiveStreamCard';
import SafeAreaContainer from '@app/components/SafeAreaContainer';
import EmptyState from '@app/components/ui/EmptyState';
import Screen from '@app/components/ui/Screen';
import Spinner from '@app/components/ui/Spinner';
import useHeader from '@app/hooks/useHeader';
import twitchQueries from '@app/queries/twitchQueries';
import twitchService, { Stream } from '@app/services/twitchService';
import { colors } from '@app/styles';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { FlatList, SafeAreaView, Text, View } from 'react-native';

export default function TopStreamsScreen() {
  const [refreshing, _setRefreshing] = useState(false);
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
