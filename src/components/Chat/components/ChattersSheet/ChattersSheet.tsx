import { memo, useMemo, useState } from 'react';
import { BottomSheet } from '@app/components/BottomSheet/BottomSheet';
import { Button } from '@app/components/Button/Button';
import { FlashList } from '@app/components/FlashList/FlashList';
import { Input } from '@app/components/ui/Input/Input';
import { Text } from '@app/components/ui/Text/Text';
import { theme } from '@app/styles/themes';
import {
  getAllMentionChatters,
  type ChatterRole,
  type MentionChatter,
} from '@app/utils/chat/resolveMentionLogin';
import type { ListRenderItem } from '@shopify/flash-list';
import { SymbolView } from 'expo-symbols';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { UsernamePressData } from '../ChatMessage/RichChatMessage.types';
import { CHAT_SETTINGS_SHEET_DETENT } from '../chatSheetLayout';
import { chatSheetSurface } from '../chatSheetSurface';
import { useTranslation } from 'react-i18next';

export interface ChattersSheetProps {
  isPresented: boolean;
  onDismiss: () => void;
  onSelectChatter: (chatter: UsernamePressData) => void;
}

type RoleLabelKey = 'broadcaster' | 'moderators' | 'vips' | 'viewers';

type ChattersListItem =
  | { type: 'header'; key: string; labelKey: RoleLabelKey; count: number }
  | { type: 'chatter'; key: string; chatter: MentionChatter };

const ROLE_SECTIONS: {
  role: ChatterRole | undefined;
  labelKey: RoleLabelKey;
}[] = [
  { role: 'broadcaster', labelKey: 'broadcaster' },
  { role: 'moderator', labelKey: 'moderators' },
  { role: 'vip', labelKey: 'vips' },
  { role: undefined, labelKey: 'viewers' },
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
  const normalisedQuery = query.trim().toLowerCase();
  const filtered = normalisedQuery
    ? chatters.filter(chatter =>
        chatter.login.toLowerCase().includes(normalisedQuery),
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
      key: `header_${section.labelKey}`,
      labelKey: section.labelKey,
      count: sectionChatters.length,
    });
    sectionChatters.forEach(chatter => {
      items.push({
        type: 'chatter',
        key: `chatter_${chatter.login.toLowerCase()}`,
        chatter,
      });
    });
  });

  return items;
}

function toUsernamePressData(chatter: MentionChatter): UsernamePressData {
  return {
    color: chatter.color,
    login: chatter.login.toLowerCase(),
    // The index falls back to the login as a pseudo id for mention-only
    // entries; only real numeric Twitch ids are useful downstream.
    userId: /^\d+$/.test(chatter.userId) ? chatter.userId : undefined,
    username: chatter.login,
  };
}

const ChattersSheetComponent = ({
  isPresented,
  onDismiss,
  onSelectChatter,
}: ChattersSheetProps) => {
  const { t } = useTranslation('chat');
  const [query, setQuery] = useState('');
  const { bottom: bottomInset } = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const sheetHeight = Math.round(windowHeight * CHAT_SETTINGS_SHEET_DETENT);

  // Snapshot on mount: the sheet is remounted per open, and live-updating a
  // list of every chatter on each message would churn for no benefit.
  const allChatters = useMemo(() => getAllMentionChatters(), []);
  const items = useMemo(
    () => buildChattersListItems(allChatters, query),
    [allChatters, query],
  );
  const listContentStyle = useMemo(
    () => ({ paddingBottom: bottomInset + theme.space20 }),
    [bottomInset],
  );

  const renderItem: ListRenderItem<ChattersListItem> = ({ item }) => {
    if (item.type === 'header') {
      return (
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionHeaderText} weight='semibold'>
            {t(`chatters.${item.labelKey}`)}
          </Text>
          <Text style={styles.sectionHeaderCount} weight='semibold'>
            {item.count}
          </Text>
        </View>
      );
    }

    return (
      <Button
        label={item.chatter.login}
        style={styles.chatterRow}
        onPress={() => onSelectChatter(toUsernamePressData(item.chatter))}
      >
        <Text
          numberOfLines={1}
          style={[styles.chatterName, { color: item.chatter.color }]}
          weight='semibold'
        >
          {item.chatter.login}
        </Text>
      </Button>
    );
  };

  return (
    <BottomSheet
      enableFixedSnapPoints
      isPresented={isPresented}
      onDismiss={onDismiss}
      showDragIndicator
      snapPoints={[{ fraction: CHAT_SETTINGS_SHEET_DETENT }]}
      testID='chat-chatters-sheet'
    >
      <View style={[styles.container, { height: sheetHeight }]}>
        <View style={styles.header}>
          <Text style={styles.headerEyebrow} weight='semibold'>
            {t('chatters.eyebrow')}
          </Text>
          <Text style={styles.headerTitle} weight='semibold'>
            {t('chatters.title')}
          </Text>
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
            placeholder={t('chatters.filterChatters')}
            placeholderTextColor='rgba(255,255,255,0.42)'
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
            <Text style={styles.emptyStateText}>
              {query.trim() ? t('chatters.noMatches') : t('chatters.empty')}
            </Text>
          </View>
        ) : (
          <FlashList
            data={items}
            renderItem={renderItem}
            keyExtractor={item => item.key}
            getItemType={item => item.type}
            contentContainerStyle={listContentStyle}
            keyboardShouldPersistTaps='handled'
            maintainVisibleContentPosition={{ disabled: true }}
          />
        )}
      </View>
    </BottomSheet>
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
    paddingHorizontal: theme.space20,
    paddingVertical: theme.space8,
  },
  container: {
    ...chatSheetSurface,
    alignSelf: 'stretch',
    backgroundColor: 'transparent',
    flexDirection: 'column',
    minHeight: 0,
    width: '100%',
  },
  emptyState: {
    alignItems: 'center',
    flex: 1,
    gap: theme.space12,
    justifyContent: 'center',
    paddingHorizontal: theme.space24,
  },
  emptyStateText: {
    color: theme.color.textSecondary.dark,
    fontSize: theme.fontSize12,
    lineHeight: theme.fontSize12 * 1.4,
    textAlign: 'center',
  },
  header: {
    borderBottomColor: theme.color.border.dark,
    borderBottomWidth: 1,
    paddingHorizontal: theme.space20,
    paddingVertical: theme.space12,
  },
  headerEyebrow: {
    color: theme.color.textSecondary.dark,
    fontSize: theme.fontSize11,
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: theme.fontSize18,
  },
  searchInput: {
    flex: 1,
  },
  searchWrap: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderColor: 'rgba(255,255,255,0.1)',
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius12,
    borderWidth: 1,
    flexDirection: 'row',
    gap: theme.space8,
    marginHorizontal: theme.space20,
    marginVertical: theme.space12,
    paddingHorizontal: theme.space12,
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.space8,
    paddingBottom: theme.space4,
    paddingHorizontal: theme.space20,
    paddingTop: theme.space12,
  },
  sectionHeaderCount: {
    color: theme.color.textSecondary.dark,
    fontSize: theme.fontSize11,
  },
  sectionHeaderText: {
    color: theme.color.textSecondary.dark,
    fontSize: theme.fontSize11,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});
