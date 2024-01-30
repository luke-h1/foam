import { Flex } from '@app/components/Flex';
import StreamCard from '@app/components/StreamCard';
import { Text } from '@app/components/Text';
import Spinner from '@app/components/loading/Spinner';
import twitchQueries from '@app/queries/twitchQueries';
import { Stream } from '@app/services/twitchService';
import { iconSizes, spacing } from '@app/styles';
import { Info } from '@tamagui/lucide-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { FlatList, RefreshControl, SafeAreaView } from 'react-native';
import { ScrollView, Stack } from 'tamagui';

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
          <Info
            size={24}
            color="$color"
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
    return (
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
    );
  }

  return (
    <SafeAreaView>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Stack
          paddingHorizontal={spacing.spacing8}
          space
          marginTop={spacing.spacing8}
        >
          {streams && streams.length > 0 && (
            <FlatList<Stream>
              data={streams}
              renderItem={({ item }) => <StreamCard stream={item} />}
              keyExtractor={item => item.id}
            />
          )}
        </Stack>
      </ScrollView>
    </SafeAreaView>
  );
};
export default TopStreamsScreen;
