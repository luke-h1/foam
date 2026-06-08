import { Text } from '@app/components/ui/Text/Text';
import { useMessages } from '@app/store/chat/react/selectors';
import { logger } from '@app/utils/logger';
import { useCallback, useEffect, useMemo, useRef, useState, memo } from 'react';
import type { RefObject } from 'react';

import {
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type StyleProp,
  useWindowDimensions,
  View,
  type ViewStyle,
} from 'react-native';

import type { ChatPaneFlags } from '../types/chatUiFlags';
import type { PinnedChatMessageViewModel } from '../hooks/usePinnedChatMessage';
import { styles } from '../styles';
import type { AnyChatMessageType } from '../util/messageHandlers';
import { estimateChatMessageHeightWithPretext } from '../util/pretextChatHeight';
import { getVisibleMessages } from '../util/visibleMessages';
import {
  ChatList,
  type ChatListRef,
  type ChatListRenderItem,
} from './ChatList';
import { ChatViewControls } from './ChatViewControls';
import { PinnedMessageBanner } from './PinnedMessageBanner';
import { getChatMessageListKey } from '../util/chatMessages';

const CHAT_ESTIMATED_COMFORTABLE_ROW_HEIGHT = 34;
const CHAT_ESTIMATED_COMPACT_ROW_HEIGHT = 24;
const CHAT_LIST_HORIZONTAL_INSET = 32;
const CHAT_ROW_HORIZONTAL_INSET = 12;
const CHAT_MIN_PRETEXT_WIDTH = 80;

export interface ChatMessagePaneProps {
  channelId: string;
  channelName: string;
  currentUsername?: string;
  chatDensity: 'comfortable' | 'compact';
  hiddenUsers: string[];
  hiddenPhrases: string[];
  highlightedUsers: string[];
  paneFlags: ChatPaneFlags;
  listRef: RefObject<ChatListRef | null>;
  handleScroll: (e: NativeSyntheticEvent<NativeScrollEvent>) => void;
  handleScrollBeginDrag: (e: NativeSyntheticEvent<NativeScrollEvent>) => void;
  handleScrollEndDrag: () => void;
  handleMomentumScrollEnd: () => void;
  handleEndReached: () => void;
  handleContentSizeChange: () => void;
  renderItem: ChatListRenderItem;
  keyExtractor: (item: AnyChatMessageType, index: number) => string;
  getItemType: (item: AnyChatMessageType) => string;
  listContentStyle: StyleProp<ViewStyle>;
  messageListExtraData?: unknown;
  onClearFilters: () => void;
  onRefreshPinnedMessage: () => void;
  onUnpinPinnedMessage: () => void;
  onToggleShowOnlyMentions: () => void;
  onViewableMessagesChange?: (messages: AnyChatMessageType[]) => void;
  pinnedMessage: PinnedChatMessageViewModel | null;
  pinnedMessageBusy: boolean;
  showInlineReplyContext: boolean;
}

export const ChatMessagePane = memo(
  ({
    channelId,
    channelName,
    currentUsername,
    hiddenUsers,
    hiddenPhrases,
    highlightedUsers,
    paneFlags,
    chatDensity,
    listRef,
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
    showInlineReplyContext,
  }: ChatMessagePaneProps) => {
    const {
      canModerateChat,
      connected,
      shouldMaintainScrollAtEnd,
      showOnlyMentions,
      showTimestamps,
    } = paneFlags;
    const storedMessages = useMessages() as AnyChatMessageType[];
    const rawMessages = storedMessages;
    const hasMessages = rawMessages.length > 0;
    const { width: windowWidth } = useWindowDimensions();
    const [messagePaneWidth, setMessagePaneWidth] = useState(0);
    const pretextMeasureWidth = Math.max(
      CHAT_MIN_PRETEXT_WIDTH,
      messagePaneWidth > CHAT_MIN_PRETEXT_WIDTH
        ? messagePaneWidth - CHAT_ROW_HORIZONTAL_INSET
        : Math.round(windowWidth - CHAT_LIST_HORIZONTAL_INSET),
    );
    const hasEverHadMessagesRef = useRef(false);
    const lastEmptyLogAtRef = useRef<number>(0);

    const visibleMessageOptions = {
      currentUsername,
      hiddenUsers,
      hiddenPhrases,
      showOnlyMentions,
    };

    const visibleMessages = getVisibleMessages(
      rawMessages,
      visibleMessageOptions,
    );
    const dedupedVisibleMessages = useMemo(() => {
      const seen = new Set<string>();

      return visibleMessages.filter(message => {
        const key = getChatMessageListKey(message);
        if (seen.has(key)) {
          return false;
        }

        seen.add(key);
        return true;
      });
    }, [visibleMessages]);

    const hasActiveFilters = Boolean(
      hiddenUsers.length ||
      hiddenPhrases.length ||
      highlightedUsers.length ||
      showOnlyMentions,
    );

    const listData = dedupedVisibleMessages;
    const handleMessagePaneLayout = useCallback((event: LayoutChangeEvent) => {
      const nextWidth = Math.round(event.nativeEvent.layout.width);
      setMessagePaneWidth(currentWidth =>
        Math.abs(currentWidth - nextWidth) > 1 ? nextWidth : currentWidth,
      );
    }, []);

    const getEstimatedItemSize = useCallback(
      (_index: number, item?: AnyChatMessageType, _type?: string) =>
        estimateChatMessageHeightWithPretext(item, {
          containerWidth: pretextMeasureWidth,
          density: chatDensity,
          showInlineReplyContext,
          showTimestamp: showTimestamps,
        }) ??
        (chatDensity === 'compact'
          ? CHAT_ESTIMATED_COMPACT_ROW_HEIGHT
          : CHAT_ESTIMATED_COMFORTABLE_ROW_HEIGHT),
      [
        chatDensity,
        pretextMeasureWidth,
        showInlineReplyContext,
        showTimestamps,
      ],
    );

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
      <View style={styles.messagePane} onLayout={handleMessagePaneLayout}>
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
          getEstimatedItemSize={getEstimatedItemSize}
          extraData={messageListExtraData}
          contentContainerStyle={listContentStyle}
          onViewableMessagesChange={onViewableMessagesChange}
        />
      </View>
    );
  },
);
