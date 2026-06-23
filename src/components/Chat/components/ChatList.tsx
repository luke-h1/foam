import {
  memo,
  RefObject,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
} from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import type { ReactElement } from 'react';

import {
  LegendList,
  type LegendListRef,
  type LegendListRenderItemProps,
} from '@legendapp/list/react-native';

import {
  getViewableChatMessages,
  type ViewableMessageToken,
} from '@app/components/Chat/util/getViewableChatMessages';
import { Skeleton } from '@app/components/ui/Skeleton/Skeleton';

import { getChatMessageListKey } from '../util/chatMessages';
import type { AnyChatMessageType } from '../util/messageHandlers';

// Roughly seven rows of lookahead; at 96 fast flings outran the renderer and
// showed skeleton rows.
const CHAT_DRAW_DISTANCE = 250;
const CHAT_ESTIMATED_ITEM_SIZE = 44;
const CHAT_END_REACHED_THRESHOLD = 0.02;
const CHAT_VIEWABILITY_CONFIG = {
  itemVisiblePercentThreshold: 1,
  // Skip viewability churn for rows that only flash past during a fling.
  minimumViewTime: 100,
};
// Re-pin to the end on new messages (dataChange) and when an already-rendered
// row grows after its real height is measured (itemLayout) — the latter keeps
// an under-estimated emote/username row from staying clipped at the bottom.
const CHAT_MAINTAIN_SCROLL_AT_END = {
  on: { dataChange: true, itemLayout: true },
};
const CHAT_MAINTAIN_SCROLL_AT_END_THRESHOLD = 0.1;
const CHAT_RECYCLE_ITEMS = true;

function ChatListRowSkeleton({ index }: { index: number }) {
  return (
    <View style={styles.skeletonRow} testID='chat-row-skeleton'>
      <Skeleton shimmer={false} style={styles.skeletonBadge} />
      <Skeleton shimmer={false} style={styles.skeletonUsername} />
      <Skeleton
        shimmer={false}
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
  handleMomentumScrollBegin: () => void;
  handleMomentumScrollEnd: () => void;
  handleEndReached: () => void;
  handleContentSizeChange: () => void;
  renderItem: ChatListRenderItem;
  keyExtractor: (item: AnyChatMessageType, index: number) => string;
  getItemType: (item: AnyChatMessageType) => string;
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
    handleMomentumScrollBegin,
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
        drawDistance={CHAT_DRAW_DISTANCE}
        // v3 has no per-item estimate hook; rows are measured on layout, so a
        // single initial hint is all that's needed (the pretext estimator no
        // longer feeds the list).
        estimatedItemSize={CHAT_ESTIMATED_ITEM_SIZE}
        // Disabled due repeated iOS crashes ("attempt to recycle mounted view")
        // when rows are updated while actively scrolled.
        recycleItems={CHAT_RECYCLE_ITEMS}
        keyExtractor={keyExtractor}
        getItemType={getItemType}
        maintainVisibleContentPosition={
          shouldMaintainScrollAtEnd ? undefined : true
        }
        maintainScrollAtEnd={
          shouldMaintainScrollAtEnd ? CHAT_MAINTAIN_SCROLL_AT_END : false
        }
        maintainScrollAtEndThreshold={CHAT_MAINTAIN_SCROLL_AT_END_THRESHOLD}
        onScroll={handleScroll}
        onScrollBeginDrag={handleScrollBeginDrag}
        onScrollEndDrag={handleScrollEndDrag}
        onMomentumScrollBegin={handleMomentumScrollBegin}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        onEndReached={handleEndReached}
        onEndReachedThreshold={CHAT_END_REACHED_THRESHOLD}
        onContentSizeChange={handleContentSizeChange}
        renderItem={renderLegendItem}
        extraData={extraData}
        style={styles.list}
        contentContainerStyle={contentContainerStyle}
        // The composer lives in a sibling KeyboardStickyView, so RN's built-in
        // tap-to-dismiss never fires for it; dragging the list is the reliable
        // way to dismiss, and handled-taps keep row touchables working.
        keyboardDismissMode='on-drag'
        keyboardShouldPersistTaps='handled'
        scrollEventThrottle={16}
        viewabilityConfig={CHAT_VIEWABILITY_CONFIG}
        onViewableItemsChanged={onViewableItemsChanged}
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
