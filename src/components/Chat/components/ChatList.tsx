import {
  FlashList,
  type FlashListRef,
  type ListRenderItem,
} from '@app/components/FlashList/FlashList';
import { Skeleton } from '@app/components/ui/Skeleton/Skeleton';
import { memo, RefObject, useCallback, useEffect, useRef } from 'react';
import {
  NativeSyntheticEvent,
  NativeScrollEvent,
  StyleSheet,
  StyleProp,
  View,
  ViewStyle,
} from 'react-native';

import type { AnyChatMessageType } from '../util/messageHandlers';
import { getChatMessageListKey } from '../util/chatMessages';
import {
  getViewableChatMessages,
  type ViewableMessageToken,
} from './ChatList/utils';

const CHAT_DRAW_DISTANCE = 960;
const CHAT_END_REACHED_THRESHOLD = 0.02;
const CHAT_ESTIMATED_ITEM_SIZE = 18;
const CHAT_VIEWABILITY_CONFIG = {
  itemVisiblePercentThreshold: 1,
};
const CHAT_MAINTAIN_SCROLL_AT_END = {
  animateAutoScrollToBottom: false,
  autoscrollToBottomThreshold: 0.001,
  startRenderingFromBottom: true,
};

function ChatListRowSkeleton({ index }: { index: number }) {
  return (
    <View style={styles.skeletonRow} testID='chat-row-skeleton'>
      <Skeleton style={styles.skeletonBadge} />
      <Skeleton style={styles.skeletonUsername} />
      <Skeleton
        style={
          index % 3 === 0
            ? styles.skeletonBodyShort
            : index % 3 === 1
              ? styles.skeletonBodyMedium
              : styles.skeletonBodyLong
        }
      />
    </View>
  );
}

export type ChatListRef = FlashListRef<AnyChatMessageType | undefined>;

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
  renderItem: ListRenderItem<AnyChatMessageType | undefined>;
  keyExtractor: (item: AnyChatMessageType | undefined, index: number) => string;
  getItemType: (item: AnyChatMessageType | undefined) => string;
  contentContainerStyle: StyleProp<ViewStyle>;
  extraData?: unknown;
  onViewableMessagesChange?: (messages: AnyChatMessageType[]) => void;
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
    contentContainerStyle,
    extraData,
    onViewableMessagesChange,
  }: ChatListProps) => {
    const onViewableMessagesChangeRef = useRef(onViewableMessagesChange);
    const lastViewableMessageKeysRef = useRef('');

    useEffect(() => {
      onViewableMessagesChangeRef.current = onViewableMessagesChange;
      lastViewableMessageKeysRef.current = '';
    }, [onViewableMessagesChange]);

    const onViewableItemsChangedRef = useRef(
      ({ viewableItems }: { viewableItems: ViewableMessageToken[] }) => {
        const callback = onViewableMessagesChangeRef.current;
        if (!callback) {
          return;
        }

        const messages = getViewableChatMessages(viewableItems);
        const viewableMessageKeys = messages
          .map(getChatMessageListKey)
          .join('\u001f');
        if (viewableMessageKeys === lastViewableMessageKeysRef.current) {
          return;
        }
        lastViewableMessageKeysRef.current = viewableMessageKeys;

        if (messages.length > 0) {
          callback(messages);
        }
      },
    );

    const renderFlashListItem = useCallback(
      ({
        item,
        index,
        extraData: flashListExtraData,
      }: Parameters<ListRenderItem<AnyChatMessageType | undefined>>[0]) => {
        const row = renderItem({
          item,
          index,
          target: 'Cell',
          extraData: flashListExtraData,
        });

        return row ?? <ChatListRowSkeleton index={index} />;
      },
      [renderItem],
    );

    return (
      <FlashList
        data={data}
        ref={listRef}
        drawDistance={CHAT_DRAW_DISTANCE}
        keyExtractor={keyExtractor}
        getItemType={getItemType}
        maintainVisibleContentPosition={
          shouldMaintainScrollAtEnd
            ? CHAT_MAINTAIN_SCROLL_AT_END
            : { disabled: true }
        }
        onScroll={handleScroll}
        onScrollBeginDrag={handleScrollBeginDrag}
        onScrollEndDrag={handleScrollEndDrag}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        onEndReached={handleEndReached}
        onEndReachedThreshold={CHAT_END_REACHED_THRESHOLD}
        onContentSizeChange={handleContentSizeChange}
        renderItem={renderFlashListItem}
        extraData={extraData}
        style={styles.list}
        contentContainerStyle={contentContainerStyle}
        scrollEventThrottle={16}
        viewabilityConfig={CHAT_VIEWABILITY_CONFIG}
        onViewableItemsChanged={onViewableItemsChangedRef.current}
      />
    );
  },
);

ChatList.displayName = 'ChatList';

const styles = StyleSheet.create({
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
    minHeight: CHAT_ESTIMATED_ITEM_SIZE,
    paddingHorizontal: 16,
    paddingVertical: 3,
    width: '100%',
  },
  skeletonUsername: {
    height: 10,
    width: 58,
  },
});
