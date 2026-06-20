import { EditorialSectionHeader } from '@app/components/EditorialSectionHeader/EditorialSectionHeader';
import { EmptyState } from '@app/components/ui/EmptyState/EmptyState';
import { AnimatedFlashList } from '@app/components/FlashList/AnimatedFlashList';
import { ListRenderItem } from '@app/components/FlashList/FlashList';
import { SymbolView } from 'expo-symbols';
import { MemoizedLiveStreamCard } from '@app/components/LiveStreamCard/LiveStreamCard';
import { LiveStreamCardSkeleton } from '@app/components/LiveStreamCard/LiveStreamCardSkeleton';
import { useBottomTabOverflow } from '@app/components/TabBarBackground/useBottomTabOverflow';
import { Button } from '@app/components/Button/Button';
import { Text } from '@app/components/ui/Text/Text';
import { useAuthContext } from '@app/context/AuthContext';
import { useScrollToTop } from '@app/hooks/useScrollToTop';
import { useRefetchOnForeground } from '@app/hooks/useRefetchOnForeground';
import { useFollowedStreamsQuery } from '@app/hooks/queries/use-followed-streams-query';
import { twitchKeys } from '@app/lib/react-query/query-keys';
import { TwitchStream } from '@app/services/twitch-service';
import {
  usePreference,
  useUpdatePreferences,
} from '@app/store/preferenceStore';
import { theme } from '@app/styles/themes';
import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import {
  useEffect,
  useRef,
  useState,
  type ReactElement,
  useCallback,
} from 'react';

import { Platform, View, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { motion } from '@app/styles/motion';

import { toast } from 'sonner-native';
import i18next from '@app/i18n/i18next';
import { useTranslation } from 'react-i18next';

export interface Section {
  key: string;
  render: () => ReactElement;
  isTitle?: boolean;
}

export default function FollowingScreen() {
  const { t } = useTranslation(['stream', 'common']);
  const { authState, user } = useAuthContext();
  const queryClient = useQueryClient();
  const tabBarOverflow = useBottomTabOverflow();
  const streamListLayout = usePreference('streamListLayout');
  const updatePreferences = useUpdatePreferences();

  const refetchFollowingStreams = useCallback(
    () =>
      queryClient.refetchQueries({
        queryKey: twitchKeys.followedStreams(user?.id as string),
      }),
    [user?.id, queryClient],
  );

  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefreshFollowing = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refetchFollowingStreams();
    } finally {
      setIsRefreshing(false);
    }
  }, [refetchFollowingStreams]);

  const layoutFade = useSharedValue(1);
  const layoutFadeStyle = useAnimatedStyle(() => ({
    opacity: layoutFade.get(),
  }));

  const {
    data: streams,
    isLoading,
    isFetching,
    isError,
    isFetched,
  } = useFollowedStreamsQuery(user?.id as string, {
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
      toast.error(i18next.t('stream:failedToFetchFollowed'));
    }
  }, [isError, isFetched]);

  const renderItem: ListRenderItem<TwitchStream> = ({ item }) => {
    return <MemoizedLiveStreamCard stream={item} layout={streamListLayout} />;
  };

  // Soft dip-and-recover fade when switching layouts so rows do not
  // hard-cut between shapes.
  const setLayoutWithFade = (layout: 'compact' | 'media') => {
    if (layout === streamListLayout) {
      return;
    }
    layoutFade.set(0.35);
    layoutFade.set(
      withTiming(1, { duration: motion.medium, easing: motion.easing.out }),
    );
    updatePreferences({ streamListLayout: layout });
  };

  const handleSetCompactLayout = () => setLayoutWithFade('compact');

  const handleSetMediaLayout = () => setLayoutWithFade('media');

  if (!authState?.isLoggedIn) {
    return (
      <EmptyState
        button={t('common:signIn')}
        buttonOnPress={() => router.push('/auth-sheet')}
        content={t('followingSignInPrompt')}
        heading={t('followingHeading')}
        iconName='person.2'
        style={[styles.stateContainer, { paddingBottom: tabBarOverflow }]}
      />
    );
  }

  const showLoadingSkeleton =
    isLoading || (isFetching && streamsArray.length === 0);

  if (showLoadingSkeleton) {
    return (
      <View style={styles.container}>
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
        content={t('followingLogInPrompt')}
        heading={t('followingHeading')}
        iconName='person.2'
        style={[styles.stateContainer, { paddingBottom: tabBarOverflow }]}
      />
    );
  }

  if (isFetched && isError) {
    return (
      <EmptyState
        button={t('common:refresh')}
        buttonOnPress={() => void handleRefreshFollowing()}
        content={t('followingLoadFailedDescription')}
        heading={t('followingLoadFailed')}
        iconName='exclamationmark.triangle'
        style={[styles.stateContainer, { paddingBottom: tabBarOverflow }]}
      />
    );
  }

  if (!streams) {
    return (
      <View style={styles.container}>
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
        button={t('common:refresh')}
        buttonOnPress={() => void handleRefreshFollowing()}
        content={t('noOneIsLiveDescription')}
        heading={t('noOneIsLive')}
        iconName='antenna.radiowaves.left.and.right'
        style={[styles.stateContainer, { paddingBottom: tabBarOverflow }]}
      />
    );
  }

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.listFade, layoutFadeStyle]}>
        <AnimatedFlashList<TwitchStream>
          ref={listRef}
          data={streamsArray}
          keyExtractor={item => item.id}
          contentInsetAdjustmentBehavior='automatic'
          drawDistance={Platform.OS === 'ios' ? 500 : undefined}
          getItemType={() => 'stream-card'}
          ListHeaderComponent={
            <View>
              <EditorialSectionHeader eyebrow='For you' />
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
                    name='list.bullet'
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
              </View>
              <View style={styles.header} />
            </View>
          }
          contentContainerStyle={[
            styles.listContent,
            {
              paddingBottom: tabBarOverflow + theme.space20,
            },
          ]}
          renderItem={renderItem}
          refreshing={isRefreshing}
          onRefresh={handleRefreshFollowing}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  listFade: {
    flex: 1,
  },
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
    backgroundColor: theme.colorPrimary,
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
