import { EmptyState } from '@app/components/EmptyState';
import { AnimatedFlashList, ListRenderItem } from '@app/components/FlashList';
import { LiveStreamCard } from '@app/components/LiveStreamCard';
import { LiveStreamCardSkeleton } from '@app/components/LiveStreamCard/LiveStreamCardSkeleton';
import { RefreshControl } from '@app/components/RefreshControl';
import { ScreenHeader } from '@app/components/ScreenHeader';
import { useAuthContext } from '@app/context/AuthContext';
import { twitchQueries } from '@app/queries/twitchQueries';
import { TwitchStream } from '@app/services/twitch-service';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState, JSX, useCallback } from 'react';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { toast } from 'sonner-native';

export interface Section {
  key: string;
  render: () => JSX.Element;
  isTitle?: boolean;
}

export default function FollowingScreen() {
  const { user } = useAuthContext();
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const queryClient = useQueryClient();

  const onRefresh = async () => {
    setRefreshing(true);
    await queryClient.refetchQueries({
      queryKey: followingStreamsQuery.queryKey,
    });
    setRefreshing(false);
  };

  const followingStreamsQuery = useMemo(
    () => twitchQueries.getFollowedStreams(user?.id as string),

    [user],
  );

  const {
    data: streams,
    isLoading,
    isError,
  } = useQuery({
    ...followingStreamsQuery,
    enabled: !!user?.id,
  });

  const streamsArray = Array.isArray(streams) ? streams : [];

  const renderItem: ListRenderItem<TwitchStream> = useCallback(({ item }) => {
    return <LiveStreamCard stream={item} />;
  }, []);

  const renderHeader = useCallback(
    () => (
      <ScreenHeader
        title="Following"
        subtitle={`${streamsArray.length} channel${streamsArray.length !== 1 ? 's' : ''} live`}
        back={false}
        size="large"
        safeArea={false}
      />
    ),
    [streamsArray.length],
  );

  if (refreshing || isLoading) {
    return (
      <>
        {Array.from({ length: 5 }).map((_, index) => (
          // eslint-disable-next-line react/no-array-index-key
          <LiveStreamCardSkeleton key={index} />
        ))}
      </>
    );
  }
  if ((!isLoading && !streams) || isError) {
    // Only show error toast if user is logged in (query was enabled)
    if (user?.id) {
      toast.error('Failed to fetch followed streams');
    }
    return (
      <EmptyState
        content="Failed to fetch followed streams"
        heading="No followed streams"
      />
    );
  }

  if (streamsArray.length === 0) {
    return (
      <EmptyState
        content="None of your followed streamers are live"
        heading="It's empty in here"
      />
    );
  }

  return (
    <View style={styles.container}>
      <AnimatedFlashList<TwitchStream>
        data={streamsArray}
        keyExtractor={item => item.id}
        contentInsetAdjustmentBehavior="automatic"
        renderItem={renderItem}
        ListHeaderComponent={renderHeader}
        refreshControl={<RefreshControl onRefresh={onRefresh} />}
      />
    </View>
  );
}

const styles = StyleSheet.create(theme => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.gray.bg,
  },
}));
