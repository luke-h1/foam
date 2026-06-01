import type { ListRenderItem } from '@app/components/FlashList/FlashList';
import { Text } from '@app/components/ui/Text/Text';
import { chatStore$ } from '@app/store/chatStore/state';
import { logger } from '@app/utils/logger';
import { useSelector } from '@legendapp/state/react';
import { memo, useEffect, useMemo, useRef, type RefObject } from 'react';
import {
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type StyleProp,
  View,
  type ViewStyle,
} from 'react-native';

import type { PinnedChatMessageViewModel } from '../hooks/usePinnedChatMessage';
import { styles } from '../styles';
import { isRenderableChatMessage } from '../util/chatMessages';
import type { AnyChatMessageType } from '../util/messageHandlers';
import { getVisibleMessages } from '../util/visibleMessages';
import { ChatList, type ChatListRef } from './ChatList';
import { ChatViewControls } from './ChatViewControls';
import { PinnedMessageBanner } from './PinnedMessageBanner';

export interface ChatMessagePaneProps {
  canModerateChat: boolean;
  channelId: string;
  channelName: string;
  connected: boolean;
  currentUsername?: string;
  hiddenUsers: string[];
  hiddenPhrases: string[];
  highlightedUsers: string[];
  showOnlyMentions: boolean;
  chatDensity: 'comfortable' | 'compact';
  showTimestamps: boolean;
  listRef: RefObject<ChatListRef | null>;
  shouldMaintainScrollAtEnd: boolean;
  handleScroll: (e: NativeSyntheticEvent<NativeScrollEvent>) => void;
  handleScrollBeginDrag: (e: NativeSyntheticEvent<NativeScrollEvent>) => void;
  handleScrollEndDrag: () => void;
  handleMomentumScrollEnd: () => void;
  handleEndReached: () => void;
  handleContentSizeChange: () => void;
  renderItem: ListRenderItem<AnyChatMessageType | undefined>;
  keyExtractor: (item: AnyChatMessageType | undefined, index: number) => string;
  getItemType: (item: AnyChatMessageType | undefined) => string;
  listContentStyle: StyleProp<ViewStyle>;
  messageListExtraData?: unknown;
  onClearFilters: () => void;
  onRefreshPinnedMessage: () => void;
  onUnpinPinnedMessage: () => void;
  onToggleShowOnlyMentions: () => void;
  onViewableMessagesChange?: (messages: AnyChatMessageType[]) => void;
  pinnedMessage: PinnedChatMessageViewModel | null;
  pinnedMessageBusy: boolean;
}

export const ChatMessagePane = memo(
  ({
    canModerateChat,
    channelId,
    channelName,
    connected,
    currentUsername,
    hiddenUsers,
    hiddenPhrases,
    highlightedUsers,
    showOnlyMentions,
    listRef,
    shouldMaintainScrollAtEnd,
    handleScroll,
    handleScrollBeginDrag,
    handleScrollEndDrag,
    handleMomentumScrollEnd,
    handleEndReached,
    handleContentSizeChange,
    renderItem,
    keyExtractor,
    getItemType,
    listContentStyle,
    messageListExtraData,
    onClearFilters,
    onRefreshPinnedMessage,
    onUnpinPinnedMessage,
    onToggleShowOnlyMentions,
    onViewableMessagesChange,
    pinnedMessage,
    pinnedMessageBusy,
  }: ChatMessagePaneProps) => {
    const storedMessages = useSelector(
      () => chatStore$.messages.get(true) as (AnyChatMessageType | undefined)[],
    );
    const rawMessages = useMemo(
      () => storedMessages.filter(isRenderableChatMessage),
      [storedMessages],
    );
    const hasMessages = rawMessages.length > 0;
    const hasEverHadMessagesRef = useRef(false);
    const lastEmptyLogAtRef = useRef<number>(0);

    const visibleMessageOptions = useMemo(
      () => ({
        currentUsername,
        hiddenUsers,
        hiddenPhrases,
        showOnlyMentions,
      }),
      [currentUsername, hiddenUsers, hiddenPhrases, showOnlyMentions],
    );

    const visibleMessages = useMemo(
      () => getVisibleMessages(rawMessages, visibleMessageOptions),
      [rawMessages, visibleMessageOptions],
    );

    const hasActiveFilters = useMemo(() => {
      return Boolean(
        hiddenUsers.length ||
        hiddenPhrases.length ||
        highlightedUsers.length ||
        showOnlyMentions,
      );
    }, [
      hiddenUsers.length,
      hiddenPhrases.length,
      highlightedUsers.length,
      showOnlyMentions,
    ]);

    const listData = visibleMessages;

    useEffect(() => {
      if (hasMessages) {
        hasEverHadMessagesRef.current = true;
      }
    }, [hasMessages]);

    useEffect(() => {
      if (!hasEverHadMessagesRef.current) {
        return;
      }
      if (hasMessages) {
        return;
      }

      const now = Date.now();
      if (now - lastEmptyLogAtRef.current < 2000) {
        return;
      }
      lastEmptyLogAtRef.current = now;

      logger.chat.warn('Chat messages became empty', {
        channelId,
        channelName,
      });
    }, [channelId, channelName, hasMessages]);

    return (
      <View style={styles.messagePane}>
        {!connected && !hasMessages && (
          <View style={styles.connectingContainer}>
            <Text style={styles.connectingText}>
              Connecting to {channelName}&apos;s chat...
            </Text>
          </View>
        )}

        <ChatViewControls
          hasActiveFilters={hasActiveFilters}
          onClearFilters={onClearFilters}
          onToggleShowOnlyMentions={onToggleShowOnlyMentions}
          showOnlyMentions={showOnlyMentions}
        />

        <PinnedMessageBanner
          canModerateChat={canModerateChat}
          onRefresh={onRefreshPinnedMessage}
          onUnpin={onUnpinPinnedMessage}
          pinnedMessage={pinnedMessage}
          pinnedMessageBusy={pinnedMessageBusy}
        />

        {visibleMessages.length === 0 && rawMessages.length > 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateTitle}>
              No chat messages match the current view
            </Text>
            <Text style={styles.emptyStateBody}>
              Clear filters or jump back to the latest messages.
            </Text>
          </View>
        ) : null}

        <ChatList
          data={listData}
          listRef={listRef}
          shouldMaintainScrollAtEnd={shouldMaintainScrollAtEnd}
          handleScroll={handleScroll}
          handleScrollBeginDrag={handleScrollBeginDrag}
          handleScrollEndDrag={handleScrollEndDrag}
          handleMomentumScrollEnd={handleMomentumScrollEnd}
          handleEndReached={handleEndReached}
          handleContentSizeChange={handleContentSizeChange}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          getItemType={getItemType}
          extraData={messageListExtraData}
          contentContainerStyle={listContentStyle}
          onViewableMessagesChange={onViewableMessagesChange}
        />
      </View>
    );
  },
);

ChatMessagePane.displayName = 'ChatMessagePane';
