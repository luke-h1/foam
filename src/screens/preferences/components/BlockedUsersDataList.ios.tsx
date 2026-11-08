import { StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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

import { theme } from '@app/styles/themes';

import type { BlockedUsersDataListProps } from './BlockedUsersDataList.types';

export function BlockedUsersDataList({
  data,
  onRefresh,
  onUnblockDirect,
}: BlockedUsersDataListProps) {
  const insets = useSafeAreaInsets();

  const handleDelete = (indices: number[]) => {
    for (const index of indices) {
      const user = data[index];
      if (user) {
        onUnblockDirect(user.user_id);
      }
    }
  };

  return (
    <Host
      style={[styles.content, { paddingBottom: insets.bottom }]}
      colorScheme='dark'
    >
      <List
        modifiers={[
          listStyle('insetGrouped'),
          refreshable(async () => {
            await onRefresh();
          }),
        ]}
      >
        <Section
          title='Blocked Accounts'
          footer={
            <NativeText>
              Unblocking restores normal Twitch interactions for that account.
            </NativeText>
          }
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

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
});
