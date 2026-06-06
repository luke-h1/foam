import { EditorialSectionHeader } from '@app/components/EditorialSectionHeader/EditorialSectionHeader';
import { EmptyState } from '@app/components/ui/EmptyState/EmptyState';
import { AnimatedFlashList } from '@app/components/FlashList/AnimatedFlashList';
import { ListRenderItem } from '@app/components/FlashList/FlashList';
import { SymbolView } from 'expo-symbols';
import { MemoizedLiveStreamCard } from '@app/components/LiveStreamCard/LiveStreamCard';
import { LiveStreamCardSkeleton } from '@app/components/LiveStreamCard/LiveStreamCardSkeleton';
import { RefreshIndicator } from '@app/components/RefreshControl/RefreshIndicator';
import { useBottomTabOverflow } from '@app/components/TabBarBackground/useBottomTabOverflow';
import { Button } from '@app/components/Button/Button';
import { Text } from '@app/components/ui/Text/Text';
import { useAuthContext } from '@app/context/AuthContext';
import { useScrollToTop } from '@app/hooks/useScrollToTop';
import { useRefresh } from '@app/hooks/useRefresh';
import { useRefetchOnForeground } from '@app/hooks/useRefetchOnForeground';
import { twitchQueries } from '@app/queries/twitchQueries';
import { TwitchStream } from '@app/services/twitch-service';
import {
  usePreference,
  useUpdatePreferences,
} from '@app/store/preferenceStore';
import { theme } from '@app/styles/themes';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useEffect, useRef, type ReactElement, useCallback } from 'react';

import { Platform, View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { toast } from 'sonner-native';

export interface Section {
  key: string;
  render: () => ReactElement;
  isTitle?: boolean;
}

export default function FollowingScreen() {
  const { authState, user } = useAuthContext();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  const tabBarOverflow = useBottomTabOverflow();
  const streamListLayout = usePreference('streamListLayout');
  const updatePreferences = useUpdatePreferences();

  const followingStreamsQuery = twitchQueries.getFollowedStreams(
    user?.id as string,
  );

  const refetchFollowingStreams = useCallback(
    () =>
      queryClient.refetchQueries({
        queryKey: followingStreamsQuery.queryKey,
      }),
    [followingStreamsQuery.queryKey, queryClient],
  );

  const handleRefreshFollowing = useCallback(() => {
    void refetchFollowingStreams();
  }, [refetchFollowingStreams]);

  const { scrollHandler, scrollY, isRefreshing, refreshControl } = useRefresh({
    onRefresh: refetchFollowingStreams,
  });

  const {
    data: streams,
    isLoading,
    isFetching,
    isError,
    isFetched,
  } = useQuery({
    ...followingStreamsQuery,
    enabled: !!user?.id,
    retry: 2,
    retryDelay: (attemptIndex: number) =>
      Math.min(1000 * 2 ** attemptIndex, 3000),
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  useRefetchOnForeground({
    enabled: Boolean(user?.id),
    refetch: refetchFollowingStreams,
  });

  const streamsArray = Array.isArray(streams) ? streams : [];
  const hasShownErrorToast = useRef(false);
  const listRef = useRef(null);

  useScrollToTop(listRef);

  useEffect(() => {
    if (!isError) {
      hasShownErrorToast.current = false;
      return;
    }

    if (isFetched && !hasShownErrorToast.current) {
      hasShownErrorToast.current = true;
      toast.error('Failed to fetch followed streams');
    }
  }, [isError, isFetched]);

  const renderItem: ListRenderItem<TwitchStream> = ({ item }) => {
    return <MemoizedLiveStreamCard stream={item} layout={streamListLayout} />;
  };

  const handleSetCompactLayout = () =>
    updatePreferences({ streamListLayout: 'compact' });

  const handleSetMediaLayout = () =>
    updatePreferences({ streamListLayout: 'media' });

  const handleSetTextLayout = () =>
    updatePreferences({ streamListLayout: 'text' });

  if (!authState?.isLoggedIn) {
    return (
      <EmptyState
        button='Sign In'
        buttonOnPress={() => router.push('/auth-sheet')}
        content='Connect your Twitch account to see streams from channels you follow.'
        heading='Your followed streams'
        iconName='person.2'
        style={[styles.stateContainer, { paddingBottom: tabBarOverflow }]}
      />
    );
  }

  const showLoadingSkeleton =
    isRefreshing || isLoading || (isFetching && streamsArray.length === 0);

  if (showLoadingSkeleton) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <View style={styles.headerEyebrow} />
        </View>
        {Array.from({ length: 5 }).map((_, index) => (
          // eslint-disable-next-line react/no-array-index-key
          <LiveStreamCardSkeleton key={index} layout={streamListLayout} />
        ))}
      </View>
    );
  }

  if (!user?.id) {
    return (
      <EmptyState
        button={null}
        content='Log in to see streams from channels you follow.'
        heading='Your followed streams'
        iconName='person.2'
        style={[styles.stateContainer, { paddingBottom: tabBarOverflow }]}
      />
    );
  }

  if (isFetched && isError) {
    return (
      <EmptyState
        button='Refresh'
        buttonOnPress={handleRefreshFollowing}
        content='Twitch did not return your followed streams.'
        heading="Couldn't load following"
        iconName='exclamationmark.triangle'
        style={[styles.stateContainer, { paddingBottom: tabBarOverflow }]}
      />
    );
  }

  if (!streams) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {Array.from({ length: 5 }).map((_, index) => (
          // eslint-disable-next-line react/no-array-index-key
          <LiveStreamCardSkeleton key={index} layout={streamListLayout} />
        ))}
      </View>
    );
  }

  if (streamsArray.length === 0) {
    return (
      <EmptyState
        button='Refresh'
        buttonOnPress={handleRefreshFollowing}
        content='None of your followed streamers are live right now.'
        heading='No one is live'
        iconName='antenna.radiowaves.left.and.right'
        style={[styles.stateContainer, { paddingBottom: tabBarOverflow }]}
      />
    );
  }

  return (
    <View style={styles.container}>
      <RefreshIndicator
        scrollY={scrollY}
        isRefreshing={isRefreshing}
        contentInsetTop={insets.top}
      />
      <AnimatedFlashList<TwitchStream>
        ref={listRef}
        data={streamsArray}
        keyExtractor={item => item.id}
        contentInsetAdjustmentBehavior='never'
        drawDistance={Platform.OS === 'ios' ? 500 : undefined}
        getItemType={() => 'stream-card'}
        ListHeaderComponent={
          <View>
            <EditorialSectionHeader eyebrow='For you' title='Following' />
            <View style={styles.layoutToggleRow}>
              <Button
                onPress={handleSetCompactLayout}
                style={[
                  styles.layoutToggleButton,
                  streamListLayout === 'compact' &&
                    styles.layoutToggleButtonActive,
                ]}
              >
                <SymbolView
                  name='square'
                  size={14}
                  tintColor={
                    streamListLayout === 'compact'
                      ? theme.color.text.dark
                      : theme.color.textSecondary.dark
                  }
                />
                <Text
                  type='xxs'
                  weight='semibold'
                  style={[
                    styles.layoutToggleText,
                    streamListLayout === 'compact' &&
                      styles.layoutToggleTextActive,
                  ]}
                >
                  Compact
                </Text>
              </Button>
              <Button
                onPress={handleSetMediaLayout}
                style={[
                  styles.layoutToggleButton,
                  streamListLayout === 'media' &&
                    styles.layoutToggleButtonActive,
                ]}
              >
                <SymbolView
                  name='photo'
                  size={14}
                  tintColor={
                    streamListLayout === 'media'
                      ? theme.color.text.dark
                      : theme.color.textSecondary.dark
                  }
                />
                <Text
                  type='xxs'
                  weight='semibold'
                  style={[
                    styles.layoutToggleText,
                    streamListLayout === 'media' &&
                      styles.layoutToggleTextActive,
                  ]}
                >
                  Media
                </Text>
              </Button>
              <Button
                onPress={handleSetTextLayout}
                style={[
                  styles.layoutToggleButton,
                  streamListLayout === 'text' &&
                    styles.layoutToggleButtonActive,
                ]}
              >
                <SymbolView
                  name='text.alignleft'
                  size={14}
                  tintColor={
                    streamListLayout === 'text'
                      ? theme.color.text.dark
                      : theme.color.textSecondary.dark
                  }
                />
                <Text
                  type='xxs'
                  weight='semibold'
                  style={[
                    styles.layoutToggleText,
                    streamListLayout === 'text' &&
                      styles.layoutToggleTextActive,
                  ]}
                >
                  Text First
                </Text>
              </Button>
            </View>
            <View style={styles.header} />
          </View>
        }
        contentContainerStyle={[
          styles.listContent,
          {
            paddingBottom: tabBarOverflow + theme.space20,
            paddingTop: insets.top + theme.space20,
          },
        ]}
        renderItem={renderItem}
        onScroll={scrollHandler}
        refreshControl={refreshControl}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.color.background.dark,
    flex: 1,
    overflow: 'hidden',
  },
  header: {
    borderBottomColor: theme.color.border.dark,
    borderBottomWidth: 1,
    marginBottom: theme.space12,
    marginHorizontal: theme.space20,
    minHeight: theme.space12,
  },
  headerEyebrow: {
    backgroundColor: theme.colorDarkGreen,
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius999,
    height: 6,
    marginBottom: theme.space20,
    opacity: 0.85,
    width: 56,
  },
  listContent: {
    paddingBottom: theme.space20,
  },
  layoutToggleButton: {
    alignItems: 'center',
    backgroundColor: theme.color.background.darkAlt,
    borderColor: theme.colorBorderSecondary,
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  layoutToggleButtonActive: {
    backgroundColor: theme.darkActiveContent,
    borderColor: theme.color.border.dark,
  },
  layoutToggleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.space8,
    marginBottom: theme.space20,
    marginHorizontal: theme.space20,
  },
  layoutToggleText: {
    color: theme.color.textSecondary.dark,
  },
  layoutToggleTextActive: {
    color: theme.color.text.dark,
  },
  stateContainer: {
    alignItems: 'center',
    backgroundColor: theme.color.background.dark,
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: theme.space20,
  },
});
