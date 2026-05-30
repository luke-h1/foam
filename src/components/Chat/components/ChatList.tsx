import type { ListRenderItem } from '@app/components/FlashList/FlashList';
import {
  LegendList,
  type LegendListRef,
  type LegendListRenderItemProps,
} from '@legendapp/list';
import { memo, RefObject, useCallback, useEffect, useRef } from 'react';
import {
  NativeSyntheticEvent,
  NativeScrollEvent,
  StyleProp,
  ViewStyle,
} from 'react-native';

import type { AnyChatMessageType } from '../util/messageHandlers';
import {
  getViewableChatMessages,
  type ViewableMessageToken,
} from './ChatList/utils';

const CHAT_DRAW_DISTANCE = 320;
const CHAT_END_REACHED_THRESHOLD = 0.02;
const CHAT_ESTIMATED_ITEM_SIZE = 24;
const CHAT_VIEWABILITY_CONFIG = {
  itemVisiblePercentThreshold: 1,
};
const CHAT_MAINTAIN_SCROLL_AT_END = {
  onDataChange: true,
  onItemLayout: true,
  onLayout: true,
};

interface ChatListProps {
  data: AnyChatMessageType[];
  listRef: RefObject<LegendListRef | null>;
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
  getEstimatedItemSize?: (
    index: number,
    item: AnyChatMessageType | undefined,
    type: string | undefined,
  ) => number;
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
    getEstimatedItemSize,
    contentContainerStyle,
    extraData,
    onViewableMessagesChange,
  }: ChatListProps) => {
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

        const messages = getViewableChatMessages(viewableItems);

        if (messages.length > 0) {
          callback(messages);
        }
      },
    );

    const renderLegendItem = useCallback(
      ({
        item,
        index,
        extraData: legendExtraData,
      }: LegendListRenderItemProps<
        AnyChatMessageType | undefined,
        string | undefined
      >) =>
        renderItem({
          item,
          index,
          target: 'Cell',
          extraData: legendExtraData,
        }),
      [renderItem],
    );

    return (
      <LegendList
        data={data}
        ref={listRef}
        recycleItems
        estimatedItemSize={CHAT_ESTIMATED_ITEM_SIZE}
        drawDistance={CHAT_DRAW_DISTANCE}
        keyExtractor={keyExtractor}
        getItemType={getItemType}
        getEstimatedItemSize={getEstimatedItemSize}
        maintainVisibleContentPosition
        maintainScrollAtEnd={
          shouldMaintainScrollAtEnd ? CHAT_MAINTAIN_SCROLL_AT_END : false
        }
        maintainScrollAtEndThreshold={0.001}
        onScroll={handleScroll}
        onScrollBeginDrag={handleScrollBeginDrag}
        onScrollEndDrag={handleScrollEndDrag}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        onEndReached={handleEndReached}
        onEndReachedThreshold={CHAT_END_REACHED_THRESHOLD}
        onContentSizeChange={handleContentSizeChange}
        renderItem={renderLegendItem}
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
