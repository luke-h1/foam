import { memo, RefObject, useCallback, useLayoutEffect, useRef } from 'react';
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
  type MaintainScrollAtEndOptions,
  type ViewabilityConfig,
} from '@legendapp/list/react-native';

import { getChatScale } from '@app/components/Chat/components/ChatMessage/chatScale';
import {
  getViewableChatMessages,
  type ViewableMessageToken,
} from '@app/components/Chat/util/getViewableChatMessages';
import { Skeleton } from '@app/components/ui/Skeleton/Skeleton';
import type { AnyChatMessageType } from '@app/store/chat/types/constants';
import { theme } from '@app/styles/themes';

/**
 * Roughly seven rows of lookahead; at 96 fast flings outran the renderer and
 * showed skeleton rows.
 */
const CHAT_DRAW_DISTANCE = 250;
/**
 * Deliberately under the average row height - an over-estimate leaves bare
 * list background under any row whose position recompute gets skipped.
 */
const CHAT_ESTIMATED_ITEM_SIZE = 26;
const CHAT_END_REACHED_THRESHOLD = 0.02;
const CHAT_VIEWABILITY_CONFIG = {
  itemVisiblePercentThreshold: 1,
} satisfies ViewabilityConfig;

/**
 * itemLayout keeps an under-estimated row from staying clipped at the bottom.
 */
const CHAT_MAINTAIN_SCROLL_AT_END = {
  on: { dataChange: true, itemLayout: true },
} satisfies MaintainScrollAtEndOptions;
const CHAT_MAINTAIN_SCROLL_AT_END_THRESHOLD = 0.1;

/**
 * Off: recycling crashed on iOS when rows updated while scrolled.
 */
const CHAT_RECYCLE_ITEMS = false;

const SKELETON_CHAT_SCALE = getChatScale('default', 'comfortable');

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

export interface ChatListScrollHandlers {
  onContentSizeChange: () => void;
  onEndReached: () => void;
  onMomentumScrollBegin: () => void;
  onMomentumScrollEnd: () => void;
  onScroll: (e: NativeSyntheticEvent<NativeScrollEvent>) => void;
  onScrollBeginDrag: (e: NativeSyntheticEvent<NativeScrollEvent>) => void;
  onScrollEndDrag: () => void;
}

interface ChatListProps {
  data: AnyChatMessageType[];
  /**
   * Dataset identity; without this a channel switch carries the old channel's
   * layout state and anchoring into the new one.
   */
  dataKey: string;
  listRef: RefObject<ChatListRef | null>;
  shouldMaintainScrollAtEnd: boolean;
  scrollHandlers: ChatListScrollHandlers;
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
    dataKey,
    listRef,
    shouldMaintainScrollAtEnd,
    scrollHandlers,
    renderItem,
    keyExtractor,
    getItemType,
    contentContainerStyle,
    extraData,
    onViewableMessagesChange,
  }: ChatListProps) => {
    const onViewableMessagesChangeRef = useRef(onViewableMessagesChange);

    useLayoutEffect(() => {
      onViewableMessagesChangeRef.current = onViewableMessagesChange;
    });

    /**
     * Stable identity required: LegendList re-runs setupViewability whenever
     * onViewableItemsChanged identity changes, tearing down viewability state.
     */
    const onViewableItemsChanged = useCallback(
      ({ viewableItems }: { viewableItems: ViewableMessageToken[] }) => {
        onViewableMessagesChangeRef.current?.(
          getViewableChatMessages(viewableItems),
        );
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
        dataKey={dataKey}
        ref={listRef}
        drawDistance={CHAT_DRAW_DISTANCE}
        /**
         * v3 has no per-item estimate hook; rows are measured on layout, so a
         * single initial hint is all that's needed.
         */
        estimatedItemSize={CHAT_ESTIMATED_ITEM_SIZE}
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
        onScroll={scrollHandlers.onScroll}
        onScrollBeginDrag={scrollHandlers.onScrollBeginDrag}
        onScrollEndDrag={scrollHandlers.onScrollEndDrag}
        onMomentumScrollBegin={scrollHandlers.onMomentumScrollBegin}
        onMomentumScrollEnd={scrollHandlers.onMomentumScrollEnd}
        onEndReached={scrollHandlers.onEndReached}
        onEndReachedThreshold={CHAT_END_REACHED_THRESHOLD}
        onContentSizeChange={scrollHandlers.onContentSizeChange}
        renderItem={renderLegendItem}
        extraData={extraData}
        style={styles.list}
        contentContainerStyle={contentContainerStyle}
        // The composer is in a sibling KeyboardStickyView, so RN's tap-dismiss never fires; drag to dismiss.
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
    borderCurve: 'continuous',
    borderRadius: theme.borderRadius4,
    height: SKELETON_CHAT_SCALE.badgeSize,
    width: SKELETON_CHAT_SCALE.badgeSize,
  },
  skeletonBodyLong: {
    height: 12,
    width: '54%',
  },
  skeletonBodyMedium: {
    height: 12,
    width: '42%',
  },
  skeletonBodyShort: {
    height: 12,
    width: '28%',
  },
  skeletonRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: SKELETON_CHAT_SCALE.gap,
    minHeight:
      SKELETON_CHAT_SCALE.bodyLineHeight +
      SKELETON_CHAT_SCALE.rowPaddingVertical * 2,
    paddingHorizontal: SKELETON_CHAT_SCALE.rowPaddingHorizontal,
    paddingVertical: SKELETON_CHAT_SCALE.rowPaddingVertical,
    width: '100%',
  },
  skeletonUsername: {
    height: 12,
    width: 64,
  },
});
