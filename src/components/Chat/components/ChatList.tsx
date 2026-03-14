import { FlashList, FlashListRef } from '@app/components/FlashList/FlashList';
import { chatStore$ } from '@app/store/chatStore/state';
import { useSelector } from '@legendapp/state/react';
import {
  JSXElementConstructor,
  memo,
  MutableRefObject,
  ReactElement,
  RefObject,
  useEffect,
  useRef,
} from 'react';
import {
  NativeSyntheticEvent,
  NativeScrollEvent,
  StyleProp,
  ViewStyle,
} from 'react-native';

import type { AnyChatMessageType } from '../util/messageHandlers';

interface ChatListProps {
  listRef: RefObject<FlashListRef<AnyChatMessageType> | null>;
  isAtBottomRef: MutableRefObject<boolean>;
  handleScroll: (e: NativeSyntheticEvent<NativeScrollEvent>) => void;
  renderItem: ({
    item,
  }: {
    item: AnyChatMessageType;
  }) => ReactElement<unknown, string | JSXElementConstructor<unknown>> | null;
  keyExtractor: (item: AnyChatMessageType) => string;
  getItemType: (item: AnyChatMessageType) => string;
  contentContainerStyle: StyleProp<ViewStyle>;
}

/**
 * Isolated FlashList wrapper that is the only subscriber to chatStore$.messages.
 * This prevents the parent Chat component from re-rendering on every message arrival,
 * which was the root cause of the blank-screen flash on each IRC message batch.
 */
export const ChatList = memo(
  ({
    listRef,
    isAtBottomRef,
    handleScroll,
    renderItem,
    keyExtractor,
    getItemType,
    contentContainerStyle,
  }: ChatListProps) => {
    const messages = useSelector(chatStore$.messages);

    const prevMessageCountRef = useRef(0);
    useEffect(() => {
      const count = Array.isArray(messages) ? messages.length : 0;
      if (
        count > prevMessageCountRef.current &&
        isAtBottomRef.current &&
        listRef.current
      ) {
        listRef.current.scrollToEnd({ animated: false });
      }
      prevMessageCountRef.current = count;
    }, [messages, isAtBottomRef, listRef]);

    const data = (
      Array.isArray(messages) ? (messages as AnyChatMessageType[]) : []
    ).filter((m): m is AnyChatMessageType => m != null);

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
