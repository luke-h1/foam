import { Text } from '@app/components/ui/Text/Text';
import { useMessages } from '@app/store/chatStore/hooks';
import { logger } from '@app/utils/logger';
import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from 'react';
import {
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type StyleProp,
  View,
  type ViewStyle,
} from 'react-native';

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

const CHAT_ESTIMATED_COMFORTABLE_ROW_HEIGHT = 34;
const CHAT_ESTIMATED_COMPACT_ROW_HEIGHT = 24;

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
    chatDensity,
    showTimestamps,
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
    const storedMessages = useMessages() as AnyChatMessageType[];
    const rawMessages = storedMessages;
    const hasMessages = rawMessages.length > 0;
    const [messagePaneWidth, setMessagePaneWidth] = useState(0);
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
    const handleMessagePaneLayout = useCallback((event: LayoutChangeEvent) => {
      const nextWidth = Math.round(event.nativeEvent.layout.width);
      setMessagePaneWidth(currentWidth =>
        Math.abs(currentWidth - nextWidth) > 1 ? nextWidth : currentWidth,
      );
    }, []);
    const getEstimatedItemSize = useCallback(
      (_index: number, item?: AnyChatMessageType, _type?: string) =>
        estimateChatMessageHeightWithPretext(item, {
          containerWidth: messagePaneWidth,
          density: chatDensity,
          showTimestamp: showTimestamps,
        }) ??
        (chatDensity === 'compact'
          ? CHAT_ESTIMATED_COMPACT_ROW_HEIGHT
          : CHAT_ESTIMATED_COMFORTABLE_ROW_HEIGHT),
      [chatDensity, messagePaneWidth, showTimestamps],
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

ChatMessagePane.displayName = 'ChatMessagePane';
