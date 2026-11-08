import { memo, useCallback, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { ListRenderItem } from '@shopify/flash-list';

import { ChatSheet } from '@app/components/chat/components/sheet/ChatSheet';
import { chatSheetStyles } from '@app/components/chat/components/sheet/ChatSheet.styles';
import { useChatSheet } from '@app/components/chat/components/sheet/hooks/use-chat-sheet';
import { useChatSheetHeight } from '@app/components/chat/components/sheet/hooks/use-chat-sheet-height';
import { SheetHeader } from '@app/components/chat/components/sheet/SheetHeader';
import {
  CHAT_SETTINGS_SHEET_DETENT,
  type ChatSheetLayout,
} from '@app/components/chat/components/sheet/util/chatSheetLayout';
import { FlashList } from '@app/components/flash-list/FlashList';
import { PressableArea } from '@app/components/pressable-area/PressableArea';
import { SymbolView } from '@app/components/ui/icon/Icon';
import { Input } from '@app/components/ui/input/Input';
import { Text } from '@app/components/ui/text/Text';
import type { UsernamePressData } from '@app/store/chat/types/chat-press-data';
import { theme } from '@app/styles/themes';
import { normaliseChatUsername } from '@app/utils/chat/chat-usernames/normaliseChatUsername';
import { getAllMentionChatters } from '@app/utils/chat/resolve-mention-login/getAllMentionChatters';
import {
  type ChatterRole,
  type MentionChatter,
} from '@app/utils/chat/resolve-mention-login/types';

export interface ChattersSheetProps {
  onDismiss: () => void;
  onSelectChatter: (chatter: UsernamePressData) => void;
}

type ChattersListItem =
  | { type: 'header'; key: string; label: string; count: number }
  | { type: 'chatter'; key: string; chatter: MentionChatter };

const ROLE_SECTIONS: {
  role: ChatterRole | undefined;
  label: string;
}[] = [
  { role: 'broadcaster', label: 'Broadcaster' },
  { role: 'moderator', label: 'Moderators' },
  { role: 'vip', label: 'VIPs' },
  { role: undefined, label: 'Viewers' },
];

function compareChattersByLogin(
  left: MentionChatter,
  right: MentionChatter,
): number {
  return left.login.localeCompare(right.login, undefined, {
    sensitivity: 'base',
  });
}

function buildChattersListItems(
  chatters: MentionChatter[],
  query: string,
): ChattersListItem[] {
  const normalisedQuery = normaliseChatUsername(query);

  const filtered = normalisedQuery
    ? chatters.filter(chatter =>
        normaliseChatUsername(chatter.login).includes(normalisedQuery),
      )
    : chatters;

  const items: ChattersListItem[] = [];

  ROLE_SECTIONS.forEach(section => {
    const sectionChatters = filtered
      .filter(chatter => chatter.role === section.role)
      .sort(compareChattersByLogin);

    if (sectionChatters.length === 0) {
      return;
    }

    items.push({
      type: 'header',
      key: `header_${section.label}`,
      label: section.label,
      count: sectionChatters.length,
    });

    sectionChatters.forEach(chatter => {
      items.push({
        type: 'chatter',
        key: `chatter_${normaliseChatUsername(chatter.login)}`,
        chatter,
      });
    });
  });

  return items;
}

const getChattersListItemKey = (item: ChattersListItem) => item.key;

const getChattersListItemType = (item: ChattersListItem) => item.type;

function toUsernamePressData(chatter: MentionChatter): UsernamePressData {
  return {
    color: chatter.color,
    login: normaliseChatUsername(chatter.login),
    userId: chatter.userId,
    username: chatter.login,
  };
}

const SHEET_LAYOUT: ChatSheetLayout = {
  fraction: CHAT_SETTINGS_SHEET_DETENT,
  kind: 'fraction',
};

const ChattersSheetComponent = ({
  onDismiss,
  onSelectChatter,
}: ChattersSheetProps) => {
  const [query, setQuery] = useState('');
  const { requestClose, sheetRef } = useChatSheet();
  const {
    bottom: bottomInset,
    left: leftInset,
    right: rightInset,
  } = useSafeAreaInsets();
  const sheetHeight = useChatSheetHeight(SHEET_LAYOUT);

  // Snapshot on mount: the sheet is remounted per open, and live-updating a
  // list of every chatter on each message would churn for no benefit.
  const allChatters = useMemo(() => getAllMentionChatters(), []);

  const items = useMemo(
    () => buildChattersListItems(allChatters, query),
    [allChatters, query],
  );

  const listContentStyle = useMemo(
    () => ({
      paddingBottom: bottomInset + theme.space20,
      paddingLeft: leftInset,
      paddingRight: rightInset,
    }),
    [bottomInset, leftInset, rightInset],
  );

  const renderItem: ListRenderItem<ChattersListItem> = useCallback(
    ({ item }) => {
      if (item.type === 'header') {
        return (
          <Text
            type='footnote'
            weight='semibold'
            color='gray.textLow'
            tabular
            style={styles.sectionHeader}
          >
            {`${item.label} · ${item.count}`}
          </Text>
        );
      }

      return (
        <PressableArea
          feedback='highlight'
          accessibilityLabel={item.chatter.login}
          onPress={() => onSelectChatter(toUsernamePressData(item.chatter))}
        >
          <View style={styles.chatterRow}>
            <Text
              type='callout'
              family='brand'
              numberOfLines={1}
              style={[styles.chatterName, { color: item.chatter.color }]}
              weight='semibold'
            >
              {item.chatter.login}
            </Text>
          </View>
        </PressableArea>
      );
    },
    [onSelectChatter],
  );

  return (
    <ChatSheet
      ref={sheetRef}
      onDismiss={onDismiss}
      layout={SHEET_LAYOUT}
      testID='chat-chatters-sheet'
    >
      <View style={[chatSheetStyles.listContainer, { height: sheetHeight }]}>
        <View style={styles.header}>
          <SheetHeader title='Chatters' onClose={requestClose} />
        </View>

        <View style={styles.searchWrap}>
          <SymbolView
            name='magnifyingglass'
            size={16}
            tintColor={theme.color.textSecondary.dark}
          />
          <Input
            autoCapitalize='none'
            autoComplete='off'
            autoCorrect={false}
            color='white'
            onChangeText={setQuery}
            placeholder='Filter chatters'
            placeholderTextColor={theme.color.textSecondary.dark}
            radius='none'
            returnKeyType='search'
            size='sm'
            style={styles.searchInput}
            value={query}
            variant='soft'
          />
        </View>

        {items.length === 0 ? (
          <View style={styles.emptyState}>
            <SymbolView
              name='person.2'
              size={28}
              tintColor={theme.color.textSecondary.dark}
            />
            <Text type='subhead' color='gray.textLow' align='center'>
              {query.trim()
                ? 'No chatters match your filter.'
                : 'No chatters yet. People appear here once they send a message.'}
            </Text>
          </View>
        ) : (
          <FlashList
            nestedScrollEnabled
            data={items}
            renderItem={renderItem}
            keyExtractor={getChattersListItemKey}
            getItemType={getChattersListItemType}
            contentContainerStyle={listContentStyle}
            keyboardShouldPersistTaps='handled'
            maintainVisibleContentPosition={{ disabled: true }}
          />
        )}
      </View>
    </ChatSheet>
  );
};

export const ChattersSheet = memo(ChattersSheetComponent);

const styles = StyleSheet.create({
  chatterName: {
    flex: 1,
    fontSize: theme.fontSize17,
  },
  chatterRow: {
    alignItems: 'center',
    flexDirection: 'row',
    minHeight: 44,
    paddingHorizontal: theme.space16,
    paddingVertical: theme.space8,
  },
  emptyState: {
    alignItems: 'center',
    flex: 1,
    gap: theme.space12,
    justifyContent: 'center',
    paddingHorizontal: theme.space24,
  },
  header: {
    paddingHorizontal: theme.space16,
    paddingTop: theme.space12,
  },
  searchInput: {
    backgroundColor: 'transparent',
    flex: 1,
    paddingHorizontal: 0,
  },
  searchWrap: {
    alignItems: 'center',
    /**
     * UISearchTextField dark-mode fill, the same as the emote picker.
     */
    backgroundColor: 'rgba(118, 118, 128, 0.24)',
    borderCurve: 'continuous',
    borderRadius: theme.radius.md,
    flexDirection: 'row',
    gap: theme.space8,
    marginHorizontal: theme.space16,
    marginVertical: theme.space12,
    paddingHorizontal: theme.space12,
  },
  sectionHeader: {
    paddingBottom: theme.space4,
    paddingHorizontal: theme.space16,
    paddingTop: theme.space16,
  },
});
