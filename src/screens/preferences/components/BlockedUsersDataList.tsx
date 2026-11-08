import { StyleSheet, View } from 'react-native';

import type { ListRenderItem } from '@shopify/flash-list';

import { FlashList } from '@app/components/flash-list/FlashList';
import { Text } from '@app/components/ui/text/Text';
import { theme } from '@app/styles/themes';
import type { UserBlockList } from '@app/types/twitch/user';

import { BlockedUserItem } from './BlockedUserRow';
import type { BlockedUsersDataListProps } from './BlockedUsersDataList.types';
import { BlockedUsersSectionHeader } from './BlockedUsersSectionHeader';

export function BlockedUsersDataList({
  data,
  listRef,
  onRefresh,
  onUnblock,
}: BlockedUsersDataListProps) {
  const renderItem: ListRenderItem<UserBlockList> = ({ item, index }) => (
    <BlockedUserItem
      user={item}
      index={index}
      count={data.length}
      onUnblock={onUnblock}
    />
  );

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
          <Text
            type='caption'
            color='gray.textLow'
            style={styles.sectionFooter}
          >
            Unblocking restores normal Twitch interactions for that account.
          </Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: theme.space24,
  },
  sectionFooter: {
    lineHeight: 18,
    paddingHorizontal: theme.space16,
    paddingTop: theme.space8,
  },
});
