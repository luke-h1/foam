import SafeAreaContainer from '@app/components/SafeAreaContainer';
import StreamCard from '@app/components/StreamCard';
import twitchQueries from '@app/queries/twitchQueries';
import { Stream } from '@app/services/twitchService';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { FlatList, Text, View } from 'react-native';

export default function TopStreamsScreen() {
  const {
    data: streams,
    isLoading,
    isError,
  } = useQuery({
    ...twitchQueries.getTopStreams,
    refetchOnMount: true,
  });

  console.log('streams', streams?.length);

  if (isLoading) {
    return null;
  }
  if (isError) {
    return null;
  }

  return (
    <SafeAreaContainer>
      {streams && streams.length > 0 && (
        <View>
          <FlatList<Stream>
            data={streams}
            keyExtractor={item => item.id}
            renderItem={({ item }) => <StreamCard stream={item} />}
          />
        </View>
      )}
      <Text>Top Streams Screen</Text>
    </SafeAreaContainer>
  );
}
