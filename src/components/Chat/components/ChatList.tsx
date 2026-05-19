import {
  FlashList,
  FlashListRef,
  ListRenderItem,
} from '@app/components/FlashList/FlashList';
import { memo, MutableRefObject, RefObject, useEffect, useRef } from 'react';
import {
  NativeSyntheticEvent,
  NativeScrollEvent,
  StyleProp,
  ViewStyle,
} from 'react-native';

import type { AnyChatMessageType } from '../util/messageHandlers';

const CHAT_DRAW_DISTANCE = 320;
const CHAT_END_REACHED_THRESHOLD = 0.02;
const CHAT_VIEWABILITY_CONFIG = {
  itemVisiblePercentThreshold: 1,
};

interface ChatListProps {
  data: AnyChatMessageType[];
  listRef: RefObject<FlashListRef<AnyChatMessageType> | null>;
  isAtBottomRef: MutableRefObject<boolean>;
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

type ViewableMessageToken = {
  item?: AnyChatMessageType;
  isViewable?: boolean | null;
};

export const ChatList = memo(
  ({
    data,
    listRef,
    isAtBottomRef,
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
    const prevMessageCountRef = useRef(0);
    const onViewableMessagesChangeRef = useRef(onViewableMessagesChange);

    useEffect(() => {
      onViewableMessagesChangeRef.current = onViewableMessagesChange;
    }, [onViewableMessagesChange]);

    const onViewableItemsChangedRef = useRef(
      ({ viewableItems }: { viewableItems: ViewableMessageToken[] }) => {
        const callback = onViewableMessagesChangeRef.current;
        if (!callback) {
          return;
        }

        const messages = viewableItems
          .filter(item => item.isViewable && item.item)
          .map(item => item.item as AnyChatMessageType);

        if (messages.length > 0) {
          callback(messages);
        }
      },
    );

    useEffect(() => {
      const count = Array.isArray(data) ? data.length : 0;
      if (
        count > prevMessageCountRef.current &&
        isAtBottomRef.current &&
        listRef.current
      ) {
        listRef.current.scrollToEnd({ animated: false });
      }
      prevMessageCountRef.current = count;
    }, [data, isAtBottomRef, listRef]);

    return (
      <FlashList
        data={data}
        ref={listRef}
        drawDistance={CHAT_DRAW_DISTANCE}
        keyExtractor={keyExtractor}
        getItemType={getItemType}
        maintainVisibleContentPosition={{
          animateAutoScrollToBottom: false,
          autoscrollToBottomThreshold: 0.001,
          startRenderingFromBottom: true,
        }}
        onScroll={handleScroll}
        onScrollBeginDrag={handleScrollBeginDrag}
        onScrollEndDrag={handleScrollEndDrag}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        onEndReached={handleEndReached}
        onEndReachedThreshold={CHAT_END_REACHED_THRESHOLD}
        onContentSizeChange={handleContentSizeChange}
        renderItem={renderItem}
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

const styles = {
  list: {
    flex: 1,
  },
} as const;
