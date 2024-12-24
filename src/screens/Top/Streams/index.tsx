import LiveStreamCard from '@app/components/LiveStreamCard';
import EmptyState from '@app/components/ui/EmptyState';
import Screen from '@app/components/ui/Screen';
import Spinner from '@app/components/ui/Spinner';
import twitchQueries from '@app/queries/twitchQueries';
import { Stream } from '@app/services/twitchService';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { FlatList, RefreshControl } from 'react-native';

export default function TopStreamsScreen() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const topStreamQuery = useMemo(() => twitchQueries.getTopStreams(), []);

  const {
    data: streams,
    isLoading,
    refetch: topStreamRefetch,
  } = useQuery(topStreamQuery);

  if (refreshing || isLoading) {
    return <Spinner />;
  }

  const onRefresh = async () => {
    setRefreshing(true);
    await topStreamRefetch();
    setRefreshing(false);
  };

  if (streams) {
    return (
      <Screen
        preset="scroll"
        ScrollViewProps={{
          refreshControl: (
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          ),
        }}
      >
        <FlatList<Stream>
          data={streams}
          renderItem={({ item }) => <LiveStreamCard stream={item} />}
          keyExtractor={item => item.id}
          onRefresh={onRefresh}
          refreshing={refreshing}
        />
      </Screen>
    );
  }

  return (
    <EmptyState
      content="No Top Streams found"
      buttonOnPress={async () => {
        await topStreamRefetch();
      }}
    />
  );
}
