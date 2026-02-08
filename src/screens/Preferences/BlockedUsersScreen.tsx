import { EmptyState } from '@app/components/EmptyState/EmptyState';
import { FlashList } from '@app/components/FlashList/FlashList';
import { Icon } from '@app/components/Icon/Icon';
import { Modal } from '@app/components/Modal/Modal';
import { PressableArea } from '@app/components/PressableArea/PressableArea';
import { RefreshControl } from '@app/components/RefreshControl/RefreshControl';
import { ScreenHeader } from '@app/components/ScreenHeader/ScreenHeader';
import { Skeleton } from '@app/components/Skeleton/Skeleton';
import { Text } from '@app/components/Text/Text';
import { useAuthContext } from '@app/context/AuthContext';
import { twitchQueries } from '@app/queries/twitchQueries';
import { twitchService, UserBlockList } from '@app/services/twitch-service';
import { ListRenderItem } from '@shopify/flash-list';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo, useState } from 'react';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { toast } from 'sonner-native';

const SKELETON_COUNT = 5;

interface BlockedUserItemProps {
  user: UserBlockList;
  onUnblock: (userId: string) => void;
}

function BlockedUserItem({ user, onUnblock }: BlockedUserItemProps) {
  const handlePress = useCallback(() => {
    onUnblock(user.user_id);
  }, [onUnblock, user.user_id]);

  return (
    <View style={styles.itemContainer}>
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
        <View style={styles.unblockIconContainer}>
          <Icon icon="x-circle" size={24} color="red" />
        </View>
      </PressableArea>
    </View>
  );
}

function BlockedUserItemSkeleton() {
  return (
    <View style={styles.itemContainer}>
      <View style={styles.userInfo}>
        <Skeleton style={styles.nameSkeleton} />
        <Skeleton style={styles.loginSkeleton} />
      </View>
      <Skeleton style={styles.iconSkeleton} />
    </View>
  );
}

interface BlockedUsersListProps {
  data?: UserBlockList[];
  isLoading: boolean;
  isError: boolean;
  onRefresh: () => Promise<unknown>;
  onUnblock: (userId: string) => void;
}

function BlockedUsersList({
  isError,
  isLoading,
  data,
  onRefresh,
  onUnblock,
}: BlockedUsersListProps) {
  const renderItem = useCallback<ListRenderItem<UserBlockList>>(
    ({ item }) => <BlockedUserItem user={item} onUnblock={onUnblock} />,
    [onUnblock],
  );

  const renderSkeletonItem = useCallback<ListRenderItem<unknown>>(
    () => <BlockedUserItemSkeleton />,
    [],
  );

  if (isLoading && !data) {
    return (
      <FlashList
        data={Array.from({ length: SKELETON_COUNT })}
        renderItem={renderSkeletonItem}
        keyExtractor={(_, idx) => `skeleton-${idx}`}
        contentInsetAdjustmentBehavior="automatic"
      />
    );
  }

  if (isError) {
    return (
      <EmptyState
        heading="Failed to load blocked users"
        content="Unable to fetch your blocked users list. Please try again."
        button="Retry"
        buttonOnPress={() => void onRefresh()}
      />
    );
  }

  if (!data || data.length === 0) {
    return (
      <EmptyState
        heading="No blocked users"
        content="You haven't blocked any users yet."
      />
    );
  }

  return (
    <FlashList
      data={data}
      renderItem={renderItem}
      keyExtractor={item => item.user_id}
      contentInsetAdjustmentBehavior="automatic"
      refreshControl={<RefreshControl onRefresh={onRefresh} />}
    />
  );
}

export function BlockedUsersScreen() {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUserName, setSelectedUserName] = useState<string | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

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
          if (!old?.data) return old;
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
      setIsModalVisible(false);
      setSelectedUserId(null);
      setSelectedUserName(null);
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
    (userId: string) => {
      const blockedUser = data?.data?.find(u => u.user_id === userId);
      if (blockedUser) {
        setSelectedUserId(userId);
        setSelectedUserName(blockedUser.display_name);
        setIsModalVisible(true);
      }
    },
    [data?.data],
  );

  const handleConfirmUnblock = useCallback(() => {
    if (selectedUserId) {
      unblockMutation.mutate(selectedUserId);
    }
  }, [selectedUserId, unblockMutation]);

  const handleCancelUnblock = useCallback(() => {
    setIsModalVisible(false);
    setSelectedUserId(null);
    setSelectedUserName(null);
  }, []);

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Blocked Users"
        subtitle="Manage your blocked users list"
        size="medium"
        back={false}
      />
      <BlockedUsersList
        data={data?.data}
        isLoading={isLoading}
        isError={isError}
        onRefresh={onRefresh}
        onUnblock={handleUnblockRequest}
      />
      <Modal
        isVisible={isModalVisible}
        title="Unblock User"
        subtitle={`Are you sure you want to unblock ${selectedUserName}?`}
        confirmOnPress={{
          label: 'Unblock',
          cta: handleConfirmUnblock,
          disabled: unblockMutation.isPending,
        }}
        cancelOnPress={{
          label: 'Cancel',
          cta: handleCancelUnblock,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create(theme => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.gray.bg,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    gap: theme.spacing.md,
  },
  userInfo: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  unblockButton: {
    padding: theme.spacing.xs,
  },
  unblockIconContainer: {
    padding: theme.spacing.xs,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.red.uiAlpha,
  },
  nameSkeleton: {
    height: 16,
    width: 120,
  },
  loginSkeleton: {
    height: 14,
    width: 80,
  },
  iconSkeleton: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
}));
