import { Skeleton } from '@app/components/ui/Skeleton/Skeleton';
import {
  LegendList,
  type LegendListRef,
  type LegendListRenderItemProps,
} from '@legendapp/list/react-native';
import {
  memo,
  RefObject,
  useCallback,
  useLayoutEffect,
  useEffect,
  useRef,
} from 'react';
import type { ReactElement } from 'react';
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
} from './ChatList/getViewableChatMessages';

// Roughly seven rows of lookahead; at 96 fast flings outran the renderer and
// showed skeleton rows. NOTE: a much larger buffer (1000) combined with
// recycling corrupted LegendList's position estimation on dynamic-height rows
// (huge inter-message gaps, "54 pages" of phantom scroll height), so keep this
// moderate.
const CHAT_DRAW_DISTANCE = 250;
// A realistic average row height (badge line + one or two text lines) rather
// than a single-line minimum. v3 has no per-item estimator, so this flat hint
// is all LegendList gets; 34 under-shot most rows, forcing a scroll-position
// correction (ScrollAdjust) as each row measured taller — visible as jitter.
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
// Recycling is the dominant smoothness lever on high-volume chats: with it off,
// every row scrolled into view (and every new message) mounts a fresh tree
// (~8ms each in profiling) instead of rebinding a pooled one — GC churn = jitter.
// It was disabled for an iOS "recycle a mounted view" crash, but that came from
// @react-native-masked-view's Fabric interop; rows now use @expo/ui's
// masked-view ([[maskedview-recycle-crash]]), so the crash reason no longer
// applies. Re-verify on a paint-heavy busy chat (iOS) before release.
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
        // Keep *scroll* stabilization on in both states so swiping up through
        // off-screen rows that were under-estimated (estimatedItemSize is a
        // hint; emote/multi-line rows measure taller) doesn't lurch toward the
        // start of the list as those rows get measured. Only toggle *data*
        // anchoring:
        //   - scrolled up (`true`): anchors the visible row so it stays fixed as
        //     messages append and the backlog is trimmed off the top.
        //   - at the bottom (`undefined` = scroll-on / data-off): data anchoring
        //     would hold the *old* visible row in place, fighting the
        //     scroll-to-end that follows new messages (the #641 jitter + clipped
        //     newest row), so the manual follow in useChatScroll owns the bottom.
        // Passing `false` here (the old boolean form) also disabled scroll
        // stabilization, which is what made swipe-up jump to the top.
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
