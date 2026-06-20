import { Text } from '@app/components/ui/Text/Text';
import { theme } from '@app/styles/themes';
import { useMessages } from '@app/store/chat/react/selectors';
import { logger } from '@app/utils/logger';
import { useEffect, useMemo, useRef, memo } from 'react';
import type { RefObject } from 'react';

import {
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type StyleProp,
  View,
  type ViewStyle,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { KeyboardController } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { ChatPaneFlags } from '../types/chatUiFlags';
import type { PinnedChatMessageViewModel } from '../hooks/usePinnedChatMessage';
import { styles } from '../styles';
import type { AnyChatMessageType } from '../util/messageHandlers';
import { getVisibleMessages } from '../util/visibleMessages';
import {
  ChatList,
  type ChatListRef,
  type ChatListRenderItem,
} from './ChatList';
import { ChatViewControls } from './ChatViewControls';
import { PinnedMessageBanner } from './PinnedMessageBanner';

export interface ChatMessagePaneProps {
  channelId: string;
  channelName: string;
  currentUsername?: string;
  hiddenUsers: string[];
  hiddenPhrases: string[];
  highlightedUsers: string[];
  paneFlags: ChatPaneFlags;
  listRef: RefObject<ChatListRef | null>;
  handleScroll: (e: NativeSyntheticEvent<NativeScrollEvent>) => void;
  handleScrollBeginDrag: (e: NativeSyntheticEvent<NativeScrollEvent>) => void;
  handleScrollEndDrag: () => void;
  handleMomentumScrollBegin: () => void;
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
    channelId,
    channelName,
    currentUsername,
    hiddenUsers,
    hiddenPhrases,
    highlightedUsers,
    paneFlags,
    listRef,
    handleScroll,
    handleScrollBeginDrag,
    handleScrollEndDrag,
    handleMomentumScrollBegin,
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
    const {
      canModerateChat,
      connected,
      shouldMaintainScrollAtEnd,
      showOnlyMentions,
    } = paneFlags;
    const storedMessages = useMessages() as AnyChatMessageType[];
    const rawMessages = storedMessages;
    const hasMessages = rawMessages.length > 0;
    const hasEverHadMessagesRef = useRef(false);
    const lastEmptyLogAtRef = useRef<number>(0);
    const insets = useSafeAreaInsets();

    const dismissKeyboardGesture = useMemo(
      () =>
        Gesture.Tap()
          .maxDuration(250)
          .onEnd(() => {
            void KeyboardController.dismiss();
          })
          .runOnJS(true),
      [],
    );

    // The composer floats over the bottom of the list — Chat.tsx lifts its
    // KeyboardStickyView up by `insets.bottom`, so without this the newest row
    // scrolls to the list's true bottom and lands *behind* the composer (only
    // a sliver visible above it). Reserve that lift plus a small gap so the
    // newest message always rests just above the composer.
    const listContentStyleWithComposerClearance = useMemo(
      () => [listContentStyle, { paddingBottom: insets.bottom + theme.space8 }],
      [insets.bottom, listContentStyle],
    );

    const visibleMessages = useMemo(
      () =>
        getVisibleMessages(rawMessages, {
          currentUsername,
          hiddenUsers,
          hiddenPhrases,
          showOnlyMentions,
        }),
      [
        currentUsername,
        hiddenPhrases,
        hiddenUsers,
        rawMessages,
        showOnlyMentions,
      ],
    );
    const hasActiveFilters = Boolean(
      hiddenUsers.length ||
      hiddenPhrases.length ||
      highlightedUsers.length ||
      showOnlyMentions,
    );

    // The store guarantees unique message keys at insert time (addMessage /
    // addMessages both guard against messageKeySet, and getChatMessageListKey
    // returns the store-assigned id), so a per-render Set-based dedup over the
    // whole window — up to 600 messages on every ~100ms flush — was pure churn.
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
          <View
            style={styles.connectingContainer}
            testID='chat-sync-placeholder'
          >
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

        <GestureDetector gesture={dismissKeyboardGesture}>
          <View style={styles.listGestureWrapper}>
            <ChatList
              data={listData}
              listRef={listRef}
              shouldMaintainScrollAtEnd={shouldMaintainScrollAtEnd}
              handleScroll={handleScroll}
              handleScrollBeginDrag={handleScrollBeginDrag}
              handleScrollEndDrag={handleScrollEndDrag}
              handleMomentumScrollBegin={handleMomentumScrollBegin}
              handleMomentumScrollEnd={handleMomentumScrollEnd}
              handleEndReached={handleEndReached}
              handleContentSizeChange={handleContentSizeChange}
              renderItem={renderItem}
              keyExtractor={keyExtractor}
              getItemType={getItemType}
              extraData={messageListExtraData}
              contentContainerStyle={listContentStyleWithComposerClearance}
              onViewableMessagesChange={onViewableMessagesChange}
            />
          </View>
        </GestureDetector>
      </View>
    );
  },
);
