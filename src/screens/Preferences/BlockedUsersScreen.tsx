import { FlashList } from '@app/components/FlashList/FlashList';
import { Icon } from '@app/components/Icon/Icon';
import { PressableArea } from '@app/components/PressableArea/PressableArea';
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
import { useCallback, useMemo, useRef } from 'react';
import { Alert, ScrollView, View, StyleSheet } from 'react-native';
import { toast } from 'sonner-native';

const SKELETON_COUNT = 5;

interface BlockedUserItemProps {
  user: UserBlockList;
  index: number;
  count: number;
  onUnblock: (userId: string, userName: string) => void;
}

function BlockedUserItem({
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
      <View style={styles.userIcon}>
        <Icon icon="user-x" size={18} color={theme.colorGreyHoverAlpha} />
      </View>
      <View style={styles.userInfo}>
        <Text type="md" weight="medium">
          {user.display_name}
        </Text>
        <Text type="sm" color="gray.textLow">
          @{user.user_login}
        </Text>
      </View>
      <PressableArea
        onPress={handlePress}
        hitSlop={8}
        style={styles.unblockButton}
      >
        <Text type="xs" weight="bold" style={styles.unblockButtonLabel}>
          Unblock
        </Text>
      </PressableArea>
    </View>
  );
}

interface BlockedUserItemSkeletonProps {
  index: number;
  count: number;
}

function BlockedUserItemSkeleton({
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
      <Skeleton style={styles.userIconSkeleton} />
      <View style={styles.userInfo}>
        <Skeleton style={styles.nameSkeleton} />
        <Skeleton style={styles.loginSkeleton} />
      </View>
      <Skeleton style={styles.iconSkeleton} />
    </View>
  );
}

interface ListStatePanelProps {
  icon: string;
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
      <View style={styles.section}>
        <Text type="xxs" weight="semibold" style={styles.sectionTitle}>
          Blocked Accounts
        </Text>
        <View style={styles.statePanel}>
          <View style={styles.stateIcon}>
            <Icon icon={icon} size={28} color={theme.colorGreyHoverAlpha} />
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
            <PressableArea style={styles.pressableFill} onPress={onAction}>
              <View style={styles.retryButton}>
                <Icon icon="refresh-cw" size={16} color={theme.colorBlack} />
                <Text type="xs" weight="bold" color="accent" contrast>
                  {actionLabel}
                </Text>
              </View>
            </PressableArea>
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
      <View style={styles.listContainer}>
        <Text type="xxs" weight="semibold" style={styles.sectionTitle}>
          Blocked Accounts
        </Text>
        <FlashList
          ref={listRef}
          data={Array.from({ length: SKELETON_COUNT })}
          renderItem={renderSkeletonItem}
          keyExtractor={(_, idx) => `skeleton-${idx}`}
          contentInsetAdjustmentBehavior="automatic"
          style={styles.list}
          scrollEnabled={false}
        />
      </View>
    );
  }

  if (isError) {
    return (
      <ListStatePanel
        icon="alert-circle"
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
    <View style={styles.listContainer}>
      <View style={styles.sectionHeader}>
        <Text type="xxs" weight="semibold" style={styles.sectionTitle}>
          Blocked Accounts
        </Text>
        <Text type="xxs" color="gray.textLow">
          {data.length}
        </Text>
      </View>
      <FlashList
        ref={listRef}
        data={data}
        renderItem={renderItem}
        keyExtractor={item => item.user_id}
        contentInsetAdjustmentBehavior="automatic"
        refreshControl={<RefreshControl onRefresh={onRefresh} />}
        contentContainerStyle={styles.listContent}
        style={styles.list}
        ListFooterComponent={
          <Text type="xxs" color="gray.textLow" style={styles.sectionFooter}>
            Blocked accounts are hidden from Twitch interactions tied to your
            account.
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

  const unblockMutation = useMutation({
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
            onPress: () => unblockMutation.mutate(userId),
            style: 'destructive',
          },
        ],
      );
    },
    [unblockMutation],
  );

  return (
    <View style={styles.container}>
      <ScreenHeader title="Blocked Users" subtitle="Moderation" size="medium" />
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
  container: {
    backgroundColor: theme.color.background.dark,
    flex: 1,
  },
  firstItem: {
    borderTopLeftRadius: theme.borderRadius12,
    borderTopRightRadius: theme.borderRadius12,
  },
  iconSkeleton: {
    borderRadius: 10,
    height: 20,
    width: 20,
  },
  itemContainer: {
    alignItems: 'center',
    backgroundColor: theme.color.backgroundSecondary.dark,
    borderBottomColor: theme.colorBorderSecondary,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: theme.space12,
    marginHorizontal: theme.space16,
    paddingHorizontal: theme.space16,
    paddingVertical: theme.space16,
  },
  lastItem: {
    borderBottomLeftRadius: theme.borderRadius12,
    borderBottomRightRadius: theme.borderRadius12,
    borderBottomWidth: 0,
  },
  listContainer: {
    flex: 1,
    paddingTop: theme.space16,
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
  pressableFill: {
    alignSelf: 'stretch',
  },
  retryButton: {
    alignItems: 'center',
    alignSelf: 'stretch',
    backgroundColor: theme.colorDarkGreen,
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius10,
    flexDirection: 'row',
    gap: theme.space8,
    justifyContent: 'center',
    marginTop: theme.space8,
    paddingHorizontal: theme.space20,
    paddingVertical: theme.space12,
  },
  section: {
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
    paddingRight: theme.space16,
  },
  sectionTitle: {
    color: theme.colorGreyAlpha,
    letterSpacing: 0.5,
    paddingHorizontal: theme.space16,
    textTransform: 'uppercase',
  },
  stateContent: {
    flexGrow: 1,
    paddingTop: theme.space16,
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
    backgroundColor: theme.color.backgroundElement.dark,
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
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius12,
    gap: theme.space12,
    marginHorizontal: theme.space16,
    paddingHorizontal: theme.space20,
    paddingVertical: theme.space36,
  },
  unblockButton: {
    backgroundColor: theme.colorRedSurface,
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius20,
    paddingHorizontal: theme.space12,
    paddingVertical: theme.space8,
  },
  unblockButtonLabel: {
    color: theme.colorRed,
  },
  userIcon: {
    alignItems: 'center',
    backgroundColor: theme.color.backgroundElement.dark,
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius12,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  userIconSkeleton: {
    borderRadius: theme.borderRadius12,
    height: 40,
    width: 40,
  },
  userInfo: {
    flex: 1,
    gap: theme.space4,
  },
});
