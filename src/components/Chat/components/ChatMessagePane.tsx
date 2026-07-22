import { memo, useEffect, useMemo, useRef } from 'react';
import {
  type StyleProp,
  useColorScheme,
  View,
  type ViewStyle,
} from 'react-native';
import type { RefObject } from 'react';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { KeyboardController } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@app/components/ui/Text/Text';
import { useMessages } from '@app/store/chat/react/selectors';
import type { AnyChatMessageType } from '@app/store/chat/types/constants';
import { theme } from '@app/styles/themes';
import { logger } from '@app/utils/logger';

import type { PinnedChatMessageViewModel } from '../hooks/usePinnedChatMessage';
import { styles as chatSchemeStyles } from '../styles';
import type { ChatPaneFlags } from '../types/chatUiFlags';
import { getVisibleMessages } from '../util/visibleMessages';
import {
  ChatList,
  type ChatListRef,
  type ChatListRenderItem,
  type ChatListScrollHandlers,
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
  scrollHandlers: ChatListScrollHandlers;
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
    scrollHandlers,
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
    const colorScheme = useColorScheme();
    const scheme = colorScheme === 'light' ? 'light' : 'dark';
    const styles = chatSchemeStyles[scheme];
    const {
      canModerateChat,
      connected,
      shouldMaintainScrollAtEnd,
      showOnlyMentions,
    } = paneFlags;
    // Legend's selector types sparse arrays; the store always holds dense messages.
    const rawMessages = useMessages() as AnyChatMessageType[];
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

    /**
     * The composer floats over the bottom of the list - Chat.tsx lifts its
     * KeyboardStickyView up by `insets.bottom`, so without this the newest row
     * scrolls to the list's true bottom and lands *behind* the composer (only
     * a sliver visible above it). Reserve that lift plus a small gap so the
     * newest message always rests just above the composer.
     */
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

    /**
     * The store guarantees unique message keys at insert time (addMessage /
     * addMessages both guard against messageKeySet, and getChatMessageListKey
     * returns the store-assigned id), so a per-render Set-based dedup over the
     * whole window - up to 600 messages on every ~100ms flush - was pure churn.
     */
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
              scrollHandlers={scrollHandlers}
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
