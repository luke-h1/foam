import { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';

import { Skeleton } from '@app/components/ui/skeleton/Skeleton';
import { Text } from '@app/components/ui/text/Text';
import { theme } from '@app/styles/themes';
import type { UserBlockList } from '@app/types/twitch/user';

import { BlockedUsersActionButton } from './BlockedUsersActionButton';

interface BlockedUserItemProps {
  user: UserBlockList;
  index: number;
  count: number;
  onUnblock: (userId: string, userName: string) => void;
}

export function BlockedUserItem({
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
        <Text type='headline' weight='bold' numberOfLines={1}>
          {user.display_name}
        </Text>
        <Text type='body' color='gray.textLow' numberOfLines={1}>
          @{user.user_login}
        </Text>
      </View>
      <BlockedUsersActionButton
        label='Unblock'
        onPress={handlePress}
        style={styles.unblockButton}
        variant='destructive'
      />
    </View>
  );
}

interface BlockedUserItemSkeletonProps {
  index: number;
  count: number;
}

export function BlockedUserItemSkeleton({
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
        <View style={styles.nameSkeletonLine}>
          <Skeleton style={styles.nameSkeleton} />
        </View>
        <View style={styles.loginSkeletonLine}>
          <Skeleton style={styles.loginSkeleton} />
        </View>
      </View>
      <Skeleton style={styles.iconSkeleton} />
    </View>
  );
}

const styles = StyleSheet.create({
  firstItem: {
    borderTopLeftRadius: theme.radius.md,
    borderTopRightRadius: theme.radius.md,
  },
  iconSkeleton: {
    borderRadius: theme.radius.lg,
    height: 36,
    width: 104,
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
    borderBottomLeftRadius: theme.radius.md,
    borderBottomRightRadius: theme.radius.md,
    borderBottomWidth: 0,
  },
  loginSkeleton: {
    height: 14,
    width: 80,
  },
  loginSkeletonLine: {
    height: 24,
    justifyContent: 'center',
  },
  nameSkeleton: {
    height: 16,
    width: 120,
  },
  nameSkeletonLine: {
    height: 28,
    justifyContent: 'center',
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
