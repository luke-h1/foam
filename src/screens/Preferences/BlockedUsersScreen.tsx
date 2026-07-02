import { type RefObject, useCallback, useRef } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import {
  Host,
  List,
  Section,
  Text as NativeText,
  VStack,
} from '@expo/ui/swift-ui';
import {
  font,
  foregroundStyle,
  listStyle,
  refreshable,
} from '@expo/ui/swift-ui/modifiers';
import { ListRenderItem } from '@shopify/flash-list';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner-native';

import type { FlashListRef } from '@app/components/FlashList/FlashList';
import { FlashList } from '@app/components/FlashList/FlashList';
import { SymbolView, type SymbolViewProps } from '@app/components/ui/Icon/Icon';
import { Skeleton } from '@app/components/ui/Skeleton/Skeleton';
import { Text } from '@app/components/ui/Text/Text';
import { useAuthContext } from '@app/context/AuthContext';
import { useUserBlockListQuery } from '@app/hooks/queries/useUserBlockListQuery';
import { useScrollToTop } from '@app/hooks/useScrollToTop';
import i18next from '@app/i18n/i18next';
import { twitchKeys } from '@app/lib/react-query/query-keys';
import { twitchService } from '@app/services/twitch-service';
import { theme } from '@app/styles/themes';
import type { UserBlockList } from '@app/types/twitch/user';

import { BlockedUsersActionButton } from './components/BlockedUsersActionButton';

const SKELETON_COUNT = 5;
const SKELETON_DATA = Array.from(
  { length: SKELETON_COUNT },
  (_, index) => index,
);

interface BlockedUserItemProps {
  user: UserBlockList;
  index: number;
  count: number;
  onUnblock: (userId: string, userName: string) => void;
}

const BlockedUserItem = function BlockedUserItem({
  user,
  index,
  count,
  onUnblock,
}: BlockedUserItemProps) {
  const { t } = useTranslation('preferences');
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
        <Text type='md' weight='bold' numberOfLines={1}>
          {user.display_name}
        </Text>
        <Text type='sm' color='gray.textLow' numberOfLines={1}>
          @{user.user_login}
        </Text>
      </View>
      <BlockedUsersActionButton
        label={t('unblock')}
        onPress={handlePress}
        style={styles.unblockButton}
        variant='destructive'
      />
    </View>
  );
};

interface BlockedUserItemSkeletonProps {
  index: number;
  count: number;
}

const BlockedUserItemSkeleton = function BlockedUserItemSkeleton({
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
};

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
  onRefresh: _onRefresh,
}: ListStatePanelProps) {
  const { t } = useTranslation('preferences');

  return (
    <ScrollView
      style={styles.stateScroll}
      contentContainerStyle={styles.stateContent}
      contentInsetAdjustmentBehavior='automatic'
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.stateSection}>
        <Text type='xxs' weight='semibold' style={styles.sectionTitle}>
          {t('blockedAccounts')}
        </Text>
        <View style={styles.statePanel}>
          <View style={styles.stateIcon}>
            <SymbolView
              name={icon}
              size={28}
              tintColor={theme.colorGreyHoverAlpha}
            />
          </View>
          <Text type='lg' weight='bold' align='center'>
            {title}
          </Text>
          <Text
            type='xs'
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

interface BlockedUsersSectionHeaderProps {
  count?: number;
}

function BlockedUsersSectionHeader({ count }: BlockedUsersSectionHeaderProps) {
  const { t } = useTranslation('preferences');

  return (
    <View style={styles.sectionHeader}>
      <Text type='xxs' weight='semibold' style={styles.sectionTitle}>
        {t('blockedAccounts')}
      </Text>
      {typeof count === 'number' ? (
        <Text type='xxs' color='gray.textLow' style={styles.sectionCountText}>
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
  const { t } = useTranslation('preferences');
  const listRef = useRef(null);

  useScrollToTop(listRef);

  const renderItem: ListRenderItem<UserBlockList> = ({ item, index }) => (
    <BlockedUserItem
      user={item}
      index={index}
      count={data?.length ?? 0}
      onUnblock={onUnblock}
    />
  );

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
        title={t('couldNotLoadBlockedUsers')}
        description={t('couldNotLoadBlockedUsersDescription')}
        actionLabel={t('retry')}
        onAction={() => void onRefresh()}
        onRefresh={onRefresh}
      />
    );
  }

  if (!data || data.length === 0) {
    return (
      <ListStatePanel
        icon='shield'
        title={t('noBlockedUsers')}
        description={t('noBlockedUsersDescription')}
        onRefresh={onRefresh}
      />
    );
  }

  if (Platform.OS === 'ios') {
    return (
      <NativeBlockedUsersList
        data={data}
        onRefresh={onRefresh}
        onUnblockDirect={onUnblockDirect}
      />
    );
  }

  return (
    <BlockedUsersDataList
      data={data}
      listRef={listRef}
      onRefresh={onRefresh}
      renderItem={renderItem}
    />
  );
}

function NativeBlockedUsersList({
  data,
  onRefresh,
  onUnblockDirect,
}: {
  data: UserBlockList[];
  onRefresh: () => Promise<unknown>;
  onUnblockDirect: (userId: string) => void;
}) {
  const { t } = useTranslation('preferences');

  const handleDelete = (indices: number[]) => {
    for (const index of indices) {
      const user = data[index];
      if (user) {
        onUnblockDirect(user.user_id);
      }
    }
  };

  return (
    <Host style={styles.content} colorScheme='dark'>
      <List
        modifiers={[
          listStyle('insetGrouped'),
          refreshable(async () => {
            await onRefresh();
          }),
        ]}
      >
        <Section
          title={t('blockedAccounts')}
          footer={<NativeText>{t('blockedUsersFooter')}</NativeText>}
        >
          <List.ForEach onDelete={handleDelete}>
            {data.map(user => (
              <VStack key={user.user_id} alignment='leading' spacing={2}>
                <NativeText
                  modifiers={[
                    foregroundStyle(theme.color.text.dark),
                    font({ textStyle: 'body', weight: 'semibold' }),
                  ]}
                >
                  {user.display_name}
                </NativeText>
                <NativeText
                  modifiers={[
                    foregroundStyle(theme.color.textSecondary.dark),
                    font({ textStyle: 'footnote' }),
                  ]}
                >
                  @{user.user_login}
                </NativeText>
              </VStack>
            ))}
          </List.ForEach>
        </Section>
      </List>
    </Host>
  );
}

function BlockedUsersDataList({
  data,
  listRef,
  onRefresh,
  renderItem,
}: {
  data: UserBlockList[];
  listRef: RefObject<FlashListRef<UserBlockList> | null>;
  onRefresh: () => Promise<unknown>;
  renderItem: ListRenderItem<UserBlockList>;
}) {
  const { t } = useTranslation('preferences');

  return (
    <View style={styles.content}>
      <FlashList
        ref={listRef}
        data={data}
        renderItem={renderItem}
        keyExtractor={item => item.user_id}
        contentInsetAdjustmentBehavior='automatic'
        onRefresh={onRefresh}
        contentContainerStyle={styles.listContent}
        style={styles.list}
        ListHeaderComponent={<BlockedUsersSectionHeader count={data.length} />}
        maintainVisibleContentPosition={{ disabled: true }}
        ListFooterComponent={
          <Text type='xxs' color='gray.textLow' style={styles.sectionFooter}>
            {t('blockedUsersFooter')}
          </Text>
        }
      />
    </View>
  );
}

export function BlockedUsersScreen() {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();

  const userBlockListQueryKey = twitchKeys.blockList(user?.id as string);

  const { data, isLoading, isError } = useUserBlockListQuery(
    user?.id as string,
    { enabled: !!user?.id },
  );

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
      toast.success(i18next.t('preferences:userUnblocked'));
    },
    onError: (_error, _targetUserId, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(userBlockListQueryKey, context.previousData);
      }
      toast.error(i18next.t('preferences:failedToUnblock'));
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
    Alert.alert(
      i18next.t('preferences:unblockUser'),
      i18next.t('preferences:unblockUserConfirm', { name: userName }),
      [
        { text: i18next.t('common:cancel'), style: 'cancel' },
        {
          text: i18next.t('preferences:unblock'),
          onPress: () => unblockUser(userId),
          style: 'destructive',
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      <BlockedUsersList
        data={data?.data}
        isLoading={isLoading}
        isError={isError}
        onRefresh={onRefresh}
        onUnblock={handleUnblockRequest}
        onUnblockDirect={unblockUser}
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

const renderBlockedUserSkeletonItem: ListRenderItem<number> = ({ index }) => (
  <BlockedUserItemSkeleton index={index} count={SKELETON_COUNT} />
);
