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

interface ChatListProps {
  data: AnyChatMessageType[];
  listRef: RefObject<FlashListRef<AnyChatMessageType> | null>;
  isAtBottomRef: MutableRefObject<boolean>;
  handleScroll: (e: NativeSyntheticEvent<NativeScrollEvent>) => void;
  renderItem: ListRenderItem<AnyChatMessageType>;
  keyExtractor: (item: AnyChatMessageType) => string;
  getItemType: (item: AnyChatMessageType) => string;
  contentContainerStyle: StyleProp<ViewStyle>;
}

export const ChatList = memo(
  ({
    data,
    listRef,
    isAtBottomRef,
    handleScroll,
    renderItem,
    keyExtractor,
    getItemType,
    contentContainerStyle,
  }: ChatListProps) => {
    const prevMessageCountRef = useRef(0);
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
        keyExtractor={keyExtractor}
        getItemType={getItemType}
        onScroll={handleScroll}
        renderItem={renderItem}
        contentContainerStyle={contentContainerStyle}
        scrollEventThrottle={16}
      />
    );
  },
);

ChatList.displayName = 'ChatList';
