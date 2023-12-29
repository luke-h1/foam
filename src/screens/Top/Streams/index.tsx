import { AntDesign } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { FlatList, RefreshControl, SafeAreaView } from 'react-native';
import { ScrollView, Spinner, Stack, Text, XStack } from 'tamagui';
import StreamCard from '../../../components/ui/StreamCard';
import twitchQueries from '../../../queries/twitchQueries';
import { Stream } from '../../../services/twitchService';
import colors from '../../../styles/colors';

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

  if (!streams?.length || isError) {
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
    return <Spinner color={colors.gray} size="large" />;
  }

  return (
    <SafeAreaView
      style={{
        padding: 2,
      }}
    >
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.gray}
            colors={[colors.gray]}
          />
        }
      >
        <Stack marginTop={30} />
        <Stack>
          <XStack
            $sm={{ flexDirection: 'column' }}
            paddingHorizontal="$4"
            space
          >
            {streams.length > 0 && (
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
