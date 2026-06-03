import { Skeleton } from '@app/components/ui/Skeleton/Skeleton';
import {
  LegendList,
  type LegendListRef,
  type LegendListRenderItemProps,
} from '@legendapp/list';
import {
  memo,
  RefObject,
  useCallback,
  useEffect,
  useRef,
  type ReactElement,
} from 'react';
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

const CHAT_DRAW_DISTANCE = 96;
const CHAT_END_REACHED_THRESHOLD = 0.02;
const CHAT_ESTIMATED_ITEM_SIZE = 34;
const CHAT_INITIAL_CONTAINER_POOL_RATIO = 1;
const CHAT_MAINTAIN_SCROLL_AT_END_THRESHOLD = 0.1;
const CHAT_VIEWABILITY_CONFIG = {
  itemVisiblePercentThreshold: 1,
};
const CHAT_MAINTAIN_SCROLL_AT_END = {
  onDataChange: true,
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
        recycleItems
        estimatedItemSize={CHAT_ESTIMATED_ITEM_SIZE}
        drawDistance={CHAT_DRAW_DISTANCE}
        initialContainerPoolRatio={CHAT_INITIAL_CONTAINER_POOL_RATIO}
        keyExtractor={keyExtractor}
        getItemType={getItemType}
        getEstimatedItemSize={getEstimatedItemSize}
        maintainVisibleContentPosition
        maintainScrollAtEnd={
          shouldMaintainScrollAtEnd ? CHAT_MAINTAIN_SCROLL_AT_END : false
        }
        maintainScrollAtEndThreshold={CHAT_MAINTAIN_SCROLL_AT_END_THRESHOLD}
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
