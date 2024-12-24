import LiveStreamCard from '@app/components/LiveStreamCard';
import EmptyState from '@app/components/ui/EmptyState';
import Screen from '@app/components/ui/Screen';
import Spinner from '@app/components/ui/Spinner';
import twitchQueries from '@app/queries/twitchQueries';
import { Stream } from '@app/services/twitchService';
import { spacing } from '@app/styles';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { FlatList, ViewStyle } from 'react-native';

export default function TopStreamsScreen() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [refreshing, _setRefreshing] = useState<boolean>(false);
  const topStreamQuery = useMemo(() => twitchQueries.getTopStreams(), []);

  const {
    data: streams,
    isLoading,
    refetch: topStreamRefetch,
  } = useQuery(topStreamQuery);

  if (refreshing || isLoading) {
    return <Spinner />;
  }

  if (streams && streams.length > 0) {
    return (
      <Screen preset="scroll" style={$wrapper}>
        <FlatList<Stream>
          data={streams}
          renderItem={({ item }) => <LiveStreamCard stream={item} />}
          keyExtractor={item => item.id}
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

const $wrapper: ViewStyle = {
  padding: spacing.medium,
};
