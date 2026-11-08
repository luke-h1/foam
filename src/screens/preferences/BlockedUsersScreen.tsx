import { useCallback, useRef } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';

import type { ListRenderItem } from '@shopify/flash-list';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner-native';

import { FlashList } from '@app/components/flash-list/FlashList';
import { SymbolView, type SymbolViewProps } from '@app/components/ui/icon/Icon';
import { Text } from '@app/components/ui/text/Text';
import { useAuthContext } from '@app/context/AuthContext';
import { useScrollToTop } from '@app/hooks/use-scroll-to-top';
import { userBlockListQueryOptions } from '@app/lib/react-query/queries/twitch';
import { twitchKeys } from '@app/lib/react-query/queryKeys';
import { twitchService } from '@app/services/twitch-service';
import { theme } from '@app/styles/themes';
import type { UserBlockList } from '@app/types/twitch/user';

import { BlockedUserItemSkeleton } from './components/BlockedUserRow';
import { BlockedUsersActionButton } from './components/BlockedUsersActionButton';
import { BlockedUsersDataList } from './components/BlockedUsersDataList';
import { BlockedUsersSectionHeader } from './components/BlockedUsersSectionHeader';

const SKELETON_COUNT = 5;

const SKELETON_DATA = Array.from(
  { length: SKELETON_COUNT },
  (_, index) => index,
);

interface ListStatePanelProps {
  icon: SymbolViewProps['name'];
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

function ListStatePanel({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}: ListStatePanelProps) {
  return (
    <ScrollView
      style={styles.stateScroll}
      contentContainerStyle={styles.stateContent}
      contentInsetAdjustmentBehavior='automatic'
      indicatorStyle='white'
    >
      <View style={styles.stateSection}>
        <Text type='caption' weight='semibold' style={styles.sectionTitle}>
          Blocked Accounts
        </Text>
        <View style={styles.statePanel}>
          <View style={styles.stateIcon}>
            <SymbolView
              name={icon}
              size={28}
              tintColor={theme.colorGreyHoverAlpha}
            />
          </View>
          <Text type='title3' weight='bold' align='center'>
            {title}
          </Text>
          <Text
            type='subhead'
            color='gray.textLow'
            align='center'
            style={styles.stateDescription}
          >
            {description}
          </Text>
          {actionLabel && onAction ? (
            <BlockedUsersActionButton
              label={actionLabel}
              onPress={onAction}
              style={styles.retryButton}
            />
          ) : null}
        </View>
      </View>
    </ScrollView>
  );
}

interface BlockedUsersListProps {
  data?: UserBlockList[];
  isLoading: boolean;
  isError: boolean;
  onRefresh: () => Promise<void>;
  onUnblock: (userId: string, userName: string) => void;
  onUnblockDirect: (userId: string) => void;
}

function BlockedUsersList({
  isError,
  isLoading,
  data,
  onRefresh,
  onUnblock,
  onUnblockDirect,
}: BlockedUsersListProps) {
  const listRef = useRef(null);

  useScrollToTop(listRef);

  if (isLoading && !data) {
    return (
      <View style={styles.content}>
        <FlashList
          ref={listRef}
          data={SKELETON_DATA}
          renderItem={renderBlockedUserSkeletonItem}
          keyExtractor={(_, idx) => `skeleton-${idx}`}
          contentInsetAdjustmentBehavior='automatic'
          style={styles.list}
          ListHeaderComponent={<BlockedUsersSectionHeader />}
          maintainVisibleContentPosition={{ disabled: true }}
          scrollEnabled={false}
        />
      </View>
    );
  }

  if (isError) {
    return (
      <ListStatePanel
        icon='exclamationmark.circle'
        title='Could not load blocked users'
        description='Twitch did not return your blocked users. Try again.'
        actionLabel='Retry'
        onAction={() => void onRefresh()}
      />
    );
  }

  if (!data || data.length === 0) {
    return (
      <ListStatePanel
        icon='shield'
        title='No blocked users'
        description='Accounts you block on Twitch show here.'
      />
    );
  }

  return (
    <BlockedUsersDataList
      data={data}
      listRef={listRef}
      onRefresh={onRefresh}
      onUnblock={onUnblock}
      onUnblockDirect={onUnblockDirect}
    />
  );
}

export function BlockedUsersScreen() {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();

  // SAFETY: the key is only fetched or written once user?.id is set
  const userBlockListQueryKey = twitchKeys.blockList(user?.id as string);

  // SAFETY: enabled gates the query on user?.id being set
  const { data, isLoading, isError } = useQuery({
    ...userBlockListQueryOptions(user?.id as string),
    enabled: !!user?.id,
  });

  const { mutate: unblockUser } = useMutation({
    mutationFn: (targetUserId: string) =>
      twitchService.unblockUser(targetUserId),
    onMutate: async targetUserId => {
      await queryClient.cancelQueries({
        queryKey: userBlockListQueryKey,
      });

      const previousData = queryClient.getQueryData(userBlockListQueryKey);

      queryClient.setQueryData<{ data: UserBlockList[] }>(
        userBlockListQueryKey,
        old => {
          if (!old?.data) {
            return old;
          }

          return {
            ...old,
            data: old.data.filter(
              blockedUser => blockedUser.user_id !== targetUserId,
            ),
          };
        },
      );

      return { previousData };
    },
    onSuccess: () => {
      toast.success('User unblocked');
    },
    onError: (_error, _targetUserId, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(userBlockListQueryKey, context.previousData);
      }

      toast.error('Could not unblock user');
    },
    onSettled: () => {
      void queryClient.invalidateQueries({
        queryKey: userBlockListQueryKey,
      });
    },
  });

  const onRefresh = useCallback(async () => {
    await queryClient.refetchQueries({
      queryKey: userBlockListQueryKey,
    });
  }, [queryClient, userBlockListQueryKey]);

  const handleUnblockRequest = (userId: string, userName: string) => {
    Alert.alert('Unblock User', `Unblock ${userName}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Unblock',
        onPress: () => unblockUser(userId),
        style: 'destructive',
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <BlockedUsersList
        {...{
          data: data?.data,
          isLoading,
          isError,
          onRefresh,
          onUnblock: handleUnblockRequest,
          onUnblockDirect: unblockUser,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.color.background.dark,
    flex: 1,
  },
  content: {
    flex: 1,
  },
  list: {
    flex: 1,
  },
  retryButton: {
    marginTop: theme.space8,
  },
  sectionTitle: {
    color: theme.color.textSecondary.dark,
    paddingHorizontal: theme.space16,
  },
  stateContent: {
    flexGrow: 1,
    paddingBottom: theme.space24,
  },
  stateDescription: {
    lineHeight: 20,
    maxWidth: 300,
  },
  stateIcon: {
    alignItems: 'center',
    backgroundColor: theme.colorRedSurface,
    borderCurve: 'continuous',
    borderRadius: theme.radius.lg,
    height: 64,
    justifyContent: 'center',
    marginBottom: theme.space4,
    width: 64,
  },
  statePanel: {
    alignItems: 'center',
    backgroundColor: theme.color.backgroundSecondary.dark,
    borderColor: theme.colorBorderSecondary,
    borderCurve: 'continuous',
    borderRadius: theme.radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    gap: theme.space12,
    marginHorizontal: theme.space16,
    paddingHorizontal: theme.space20,
    paddingVertical: theme.space36,
  },
  stateScroll: {
    flex: 1,
  },
  stateSection: {
    gap: theme.space8,
  },
});

const renderBlockedUserSkeletonItem: ListRenderItem<number> = ({ index }) => (
  <BlockedUserItemSkeleton index={index} count={SKELETON_COUNT} />
);
