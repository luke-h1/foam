import { Skeleton } from '@app/components/ui/Skeleton/Skeleton';
import { Text } from '@app/components/ui/Text/Text';
import { useMessages } from '@app/store/chat/react/selectors';
import { logger } from '@app/utils/logger';
import {
  LegendList,
  type LegendListRef,
  type LegendListRenderItemProps,
} from '@legendapp/list';
import {
  memo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { ReactElement, RefObject } from 'react';

import {
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  StyleSheet,
  type StyleProp,
  useWindowDimensions,
  View,
  type ViewStyle,
} from 'react-native';

import type { ChatPaneFlags } from './types/chatUiFlags';
import type { PinnedChatMessageViewModel } from './hooks/usePinnedChatMessage';
import { styles } from './styles';
import { getChatMessageListKey } from './util/chatMessages';
import type { AnyChatMessageType } from './util/messageHandlers';
import { estimateChatMessageHeightWithPretext } from './util/pretextChatHeight';
import { getVisibleMessages } from '@app/store/chat/actions/visibleMessages';
import { ChatFilterControls } from './ChatFilterControls';
import { PinnedMessageBanner } from './PinnedMessageBanner';

type ViewableMessageToken = {
  item?: AnyChatMessageType;
  isViewable?: boolean | null;
};

export type ChatListRef = LegendListRef;

export interface ChatListRenderItemInfo {
  item?: AnyChatMessageType;
  index: number;
  target: 'Cell';
  extraData?: unknown;
}

export type ChatListRenderItem = (
  info: ChatListRenderItemInfo,
) => ReactElement | null;

interface ChatListProps {
  data: AnyChatMessageType[];
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
  getEstimatedItemSize?: (
    index: number,
    item?: AnyChatMessageType,
    type?: string,
  ) => number;
  contentContainerStyle: StyleProp<ViewStyle>;
  extraData?: unknown;
  onViewableMessagesChange?: (messages: AnyChatMessageType[]) => void;
}

function getViewableChatMessages(
  viewableItems: ViewableMessageToken[],
): AnyChatMessageType[] {
  const messages: AnyChatMessageType[] = [];

  for (const token of viewableItems) {
    if (token.isViewable && token.item) {
      messages.push(token.item);
    }
  }

  return messages;
}

function ChatListRowSkeleton({ index }: { index: number }) {
  let skeletonBodyStyle: StyleProp<ViewStyle> = chatListStyles.skeletonBodyLong;
  if (index % 3 === 0) {
    skeletonBodyStyle = chatListStyles.skeletonBodyShort;
  } else if (index % 3 === 1) {
    skeletonBodyStyle = chatListStyles.skeletonBodyMedium;
  }

  return (
    <View style={chatListStyles.skeletonRow} testID='chat-row-skeleton'>
      <Skeleton shimmer={false} style={chatListStyles.skeletonBadge} />
      <Skeleton shimmer={false} style={chatListStyles.skeletonUsername} />
      <Skeleton shimmer={false} style={skeletonBodyStyle} />
    </View>
  );
}

export const ChatList = memo(
  ({
    data,
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
    getEstimatedItemSize,
    contentContainerStyle,
    extraData,
    onViewableMessagesChange,
  }: ChatListProps) => {
    const onViewableMessagesChangeRef = useRef(onViewableMessagesChange);
    const lastViewableMessageKeysRef = useRef('');

    useEffect(() => {
      lastViewableMessageKeysRef.current = '';
    }, [onViewableMessagesChange]);

    useLayoutEffect(() => {
      onViewableMessagesChangeRef.current = onViewableMessagesChange;
    });

    // Stable identity required: LegendList re-runs setupViewability whenever
    // onViewableItemsChanged identity changes, tearing down viewability state.
    const onViewableItemsChanged = useCallback(
      ({ viewableItems }: { viewableItems: ViewableMessageToken[] }) => {
        const callback = onViewableMessagesChangeRef.current;
        if (!callback) {
          return;
        }

        const messages = getViewableChatMessages(viewableItems);
        const viewableMessageKeys = messages
          .map((message, index) => `${getChatMessageListKey(message)}:${index}`)
          .join('\u001f');
        if (viewableMessageKeys === lastViewableMessageKeysRef.current) {
          return;
        }
        lastViewableMessageKeysRef.current = viewableMessageKeys;

        callback(messages);
      },
      [],
    );

    const renderLegendItem = useCallback(
      ({
        item,
        index,
        extraData: legendExtraData,
      }: LegendListRenderItemProps<AnyChatMessageType>) => {
        const row = renderItem({
          item,
          index,
          target: 'Cell',
          extraData: legendExtraData,
        });

        return row ?? <ChatListRowSkeleton index={index} />;
      },
      [renderItem],
    );

    return (
      <LegendList
        data={data}
        ref={listRef}
        drawDistance={96}
        estimatedItemSize={34}
        initialContainerPoolRatio={1}
        // Disabled due repeated iOS crashes ("attempt to recycle mounted view")
        // when rows are updated while actively scrolled.
        recycleItems={false}
        keyExtractor={keyExtractor}
        getItemType={getItemType}
        getEstimatedItemSize={getEstimatedItemSize}
        maintainVisibleContentPosition={!shouldMaintainScrollAtEnd}
        maintainScrollAtEnd={
          shouldMaintainScrollAtEnd ? { onDataChange: true } : false
        }
        maintainScrollAtEndThreshold={0.1}
        onScroll={handleScroll}
        onScrollBeginDrag={handleScrollBeginDrag}
        onScrollEndDrag={handleScrollEndDrag}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.02}
        onContentSizeChange={handleContentSizeChange}
        renderItem={renderLegendItem}
        extraData={extraData}
        style={chatListStyles.list}
        contentContainerStyle={contentContainerStyle}
        scrollEventThrottle={16}
        viewabilityConfig={{ itemVisiblePercentThreshold: 1 }}
        onViewableItemsChanged={onViewableItemsChanged}
      />
    );
  },
);

ChatList.displayName = 'ChatList';

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
      80,
      messagePaneWidth > 80
        ? messagePaneWidth - 12
        : Math.round(windowWidth - 32),
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
        }) ?? (chatDensity === 'compact' ? 24 : 34),
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

        <ChatFilterControls
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

const chatListStyles = StyleSheet.create({
  list: {
    flex: 1,
  },
  skeletonBadge: {
    borderRadius: 999,
    height: 12,
    width: 12,
  },
  skeletonBodyLong: {
    height: 10,
    width: '54%',
  },
  skeletonBodyMedium: {
    height: 10,
    width: '42%',
  },
  skeletonBodyShort: {
    height: 10,
    width: '28%',
  },
  skeletonRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    minHeight: 34,
    paddingHorizontal: 16,
    paddingVertical: 3,
    width: '100%',
  },
  skeletonUsername: {
    height: 10,
    width: 58,
  },
});
