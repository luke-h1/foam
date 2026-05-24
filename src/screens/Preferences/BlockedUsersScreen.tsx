import { FlashList } from '@app/components/FlashList/FlashList';
import { RefreshControl } from '@app/components/RefreshControl/RefreshControl';
import { ScreenHeader } from '@app/components/ScreenHeader/ScreenHeader';
import { Skeleton } from '@app/components/ui/Skeleton/Skeleton';
import { Text } from '@app/components/ui/Text/Text';
import { useAuthContext } from '@app/context/AuthContext';
import { useScrollToTop } from '@app/hooks/useScrollToTop';
import { twitchQueries } from '@app/queries/twitchQueries';
import { twitchService, UserBlockList } from '@app/services/twitch-service';
import { theme } from '@app/styles/themes';
import { ListRenderItem } from '@shopify/flash-list';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { memo, useCallback, useMemo, useRef } from 'react';
import { Alert, ScrollView, View, StyleSheet } from 'react-native';
import { toast } from 'sonner-native';
import { BlockedUsersActionButton } from './components/BlockedUsersActionButton';

const SKELETON_COUNT = 5;

interface BlockedUserItemProps {
  user: UserBlockList;
  index: number;
  count: number;
  onUnblock: (userId: string, userName: string) => void;
}

const BlockedUserItem = memo(function BlockedUserItem({
  user,
  index,
  count,
  onUnblock,
}: BlockedUserItemProps) {
  const handlePress = useCallback(() => {
    onUnblock(user.user_id, user.display_name);
  }, [onUnblock, user.display_name, user.user_id]);

  return (
    <View
      style={[
        styles.itemContainer,
        index === 0 ? styles.firstItem : null,
        index === count - 1 ? styles.lastItem : null,
      ]}
    >
      <View style={styles.userInfo}>
        <Text type="md" weight="bold" numberOfLines={1}>
          {user.display_name}
        </Text>
        <Text type="sm" color="gray.textLow" numberOfLines={1}>
          @{user.user_login}
        </Text>
      </View>
      <BlockedUsersActionButton
        label="Unblock"
        onPress={handlePress}
        style={styles.unblockButton}
        variant="destructive"
      />
    </View>
  );
});

BlockedUserItem.displayName = 'BlockedUserItem';

interface BlockedUserItemSkeletonProps {
  index: number;
  count: number;
}

const BlockedUserItemSkeleton = memo(function BlockedUserItemSkeleton({
  index,
  count,
}: BlockedUserItemSkeletonProps) {
  return (
    <View
      style={[
        styles.itemContainer,
        index === 0 ? styles.firstItem : null,
        index === count - 1 ? styles.lastItem : null,
      ]}
    >
      <View style={styles.userInfo}>
        <Skeleton style={styles.nameSkeleton} />
        <Skeleton style={styles.loginSkeleton} />
      </View>
      <Skeleton style={styles.iconSkeleton} />
    </View>
  );
});

BlockedUserItemSkeleton.displayName = 'BlockedUserItemSkeleton';

interface ListStatePanelProps {
  icon: SymbolViewProps['name'];
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  onRefresh?: () => Promise<unknown>;
}

function ListStatePanel({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  onRefresh,
}: ListStatePanelProps) {
  return (
    <ScrollView
      style={styles.stateScroll}
      contentContainerStyle={styles.stateContent}
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={false}
      refreshControl={
        onRefresh ? <RefreshControl onRefresh={onRefresh} /> : undefined
      }
    >
      <View style={styles.stateSection}>
        <Text type="xxs" weight="semibold" style={styles.sectionTitle}>
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
          <Text type="lg" weight="bold" align="center">
            {title}
          </Text>
          <Text
            type="xs"
            color="gray.textLow"
            align="center"
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

interface BlockedUsersSectionHeaderProps {
  count?: number;
}

function BlockedUsersSectionHeader({ count }: BlockedUsersSectionHeaderProps) {
  return (
    <View style={styles.sectionHeader}>
      <Text type="xxs" weight="semibold" style={styles.sectionTitle}>
        Blocked Accounts
      </Text>
      {typeof count === 'number' ? (
        <Text type="xxs" color="gray.textLow" style={styles.sectionCountText}>
          {count}
        </Text>
      ) : null}
    </View>
  );
}

interface BlockedUsersListProps {
  data?: UserBlockList[];
  isLoading: boolean;
  isError: boolean;
  onRefresh: () => Promise<unknown>;
  onUnblock: (userId: string, userName: string) => void;
}

function BlockedUsersList({
  isError,
  isLoading,
  data,
  onRefresh,
  onUnblock,
}: BlockedUsersListProps) {
  const listRef = useRef(null);

  useScrollToTop(listRef);

  const renderItem = useCallback<ListRenderItem<UserBlockList>>(
    ({ item, index }) => (
      <BlockedUserItem
        user={item}
        index={index}
        count={data?.length ?? 0}
        onUnblock={onUnblock}
      />
    ),
    [data?.length, onUnblock],
  );

  const renderSkeletonItem = useCallback<ListRenderItem<unknown>>(
    ({ index }) => (
      <BlockedUserItemSkeleton index={index} count={SKELETON_COUNT} />
    ),
    [],
  );

  if (isLoading && !data) {
    return (
      <View style={styles.content}>
        <FlashList
          ref={listRef}
          data={Array.from({ length: SKELETON_COUNT })}
          renderItem={renderSkeletonItem}
          keyExtractor={(_, idx) => `skeleton-${idx}`}
          contentInsetAdjustmentBehavior="automatic"
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
        icon="exclamationmark.circle"
        title="Could not load blocked users"
        description="Twitch did not return your blocked users list. Refresh and try again."
        actionLabel="Retry"
        onAction={() => void onRefresh()}
        onRefresh={onRefresh}
      />
    );
  }

  if (!data || data.length === 0) {
    return (
      <ListStatePanel
        icon="shield"
        title="No blocked users"
        description="Accounts you block on Twitch will appear here for quick review."
        onRefresh={onRefresh}
      />
    );
  }

  return (
    <View style={styles.content}>
      <FlashList
        ref={listRef}
        data={data}
        renderItem={renderItem}
        keyExtractor={item => item.user_id}
        contentInsetAdjustmentBehavior="automatic"
        refreshControl={<RefreshControl onRefresh={onRefresh} />}
        contentContainerStyle={styles.listContent}
        style={styles.list}
        ListHeaderComponent={<BlockedUsersSectionHeader count={data.length} />}
        maintainVisibleContentPosition={{ disabled: true }}
        ListFooterComponent={
          <Text type="xxs" color="gray.textLow" style={styles.sectionFooter}>
            Unblocking restores normal Twitch interactions for that account.
          </Text>
        }
      />
    </View>
  );
}

export function BlockedUsersScreen() {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();

  const userBlockListQuery = useMemo(
    () =>
      twitchQueries.getUserBlockList({
        broadcasterId: user?.id as string,
      }),
    [user],
  );

  const { data, isLoading, isError } = useQuery({
    ...userBlockListQuery,
    enabled: !!user?.id,
  });

  const { mutate: unblockUser } = useMutation({
    mutationFn: (targetUserId: string) =>
      twitchService.unblockUser(targetUserId),
    onMutate: async targetUserId => {
      await queryClient.cancelQueries({
        queryKey: userBlockListQuery.queryKey,
      });

      const previousData = queryClient.getQueryData(
        userBlockListQuery.queryKey,
      );

      queryClient.setQueryData<{ data: UserBlockList[] }>(
        userBlockListQuery.queryKey,
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
      toast.success('User unblocked successfully');
    },
    onError: (_error, _targetUserId, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(
          userBlockListQuery.queryKey,
          context.previousData,
        );
      }
      toast.error('Failed to unblock user');
    },
    onSettled: () => {
      void queryClient.invalidateQueries({
        queryKey: userBlockListQuery.queryKey,
      });
    },
  });

  const onRefresh = useCallback(async () => {
    await queryClient.refetchQueries({
      queryKey: userBlockListQuery.queryKey,
    });
  }, [queryClient, userBlockListQuery.queryKey]);

  const handleUnblockRequest = useCallback(
    (userId: string, userName: string) => {
      Alert.alert(
        'Unblock User',
        `Are you sure you want to unblock ${userName}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Unblock',
            onPress: () => unblockUser(userId),
            style: 'destructive',
          },
        ],
      );
    },
    [unblockUser],
  );

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Blocked Users"
        subtitle="Moderation"
        size="compact"
      />
      <BlockedUsersList
        data={data?.data}
        isLoading={isLoading}
        isError={isError}
        onRefresh={onRefresh}
        onUnblock={handleUnblockRequest}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
  container: {
    backgroundColor: theme.color.background.dark,
    flex: 1,
  },
  firstItem: {
    borderTopLeftRadius: theme.borderRadius12,
    borderTopRightRadius: theme.borderRadius12,
  },
  iconSkeleton: {
    borderRadius: theme.borderRadius12,
    height: 28,
    width: 72,
  },
  itemContainer: {
    alignItems: 'center',
    borderBottomColor: theme.colorBorderSecondary,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: theme.space12,
    marginHorizontal: theme.space16,
    minHeight: 64,
    paddingVertical: theme.space12,
  },
  lastItem: {
    borderBottomLeftRadius: theme.borderRadius12,
    borderBottomRightRadius: theme.borderRadius12,
    borderBottomWidth: 0,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: theme.space24,
  },
  loginSkeleton: {
    height: 14,
    width: 80,
  },
  nameSkeleton: {
    height: 16,
    width: 120,
  },
  retryButton: {
    marginTop: theme.space8,
  },
  sectionCountText: {
    paddingHorizontal: theme.space16,
  },
  stateSection: {
    gap: theme.space8,
  },
  sectionFooter: {
    lineHeight: 18,
    paddingHorizontal: theme.space16,
    paddingTop: theme.space8,
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: theme.space8,
  },
  sectionTitle: {
    color: theme.colorGreyAlpha,
    letterSpacing: 0.5,
    paddingHorizontal: theme.space16,
    textTransform: 'uppercase',
  },
  stateContent: {
    flexGrow: 1,
    paddingBottom: theme.space24,
  },
  stateScroll: {
    flex: 1,
  },
  stateDescription: {
    lineHeight: 20,
    maxWidth: 300,
  },
  stateIcon: {
    alignItems: 'center',
    backgroundColor: theme.colorRedSurface,
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius20,
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
    borderRadius: theme.borderRadius12,
    borderWidth: StyleSheet.hairlineWidth,
    gap: theme.space12,
    marginHorizontal: theme.space16,
    paddingHorizontal: theme.space20,
    paddingVertical: theme.space36,
  },
  unblockButton: {
    flexShrink: 0,
  },
  userInfo: {
    flex: 1,
    gap: theme.space4,
    minWidth: 0,
  },
});
