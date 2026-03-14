import { FlashList, FlashListRef } from '@app/components/FlashList/FlashList';
import { chatStore$ } from '@app/store/chatStore/state';
import type { ChatMessageType } from '@app/store/chatStore/constants';
import { useSelector } from '@legendapp/state/react';
import { memo, useCallback, useMemo, type RefObject } from 'react';
import { StyleSheet } from 'react-native-unistyles';

import type { AnyChatMessageType } from '../../util/messageHandlers';

const ESTIMATED_ITEM_SIZE = 52;

interface ChatMessageListProps {
  listRef: RefObject<FlashListRef<AnyChatMessageType> | null>;
  onScroll: (event: unknown) => void;
  renderItem: (info: { item: AnyChatMessageType }) => React.ReactElement | null;
  scrollEventThrottle?: number;
}

/**
 * Isolated message list component that subscribes only to messages.
 * Prevents parent Chat from re-rendering on every new message, reducing
 * cascading re-renders and blank/flicker issues. Feels like native Twitch/Frosty.
 */
export const ChatMessageList = memo(function ChatMessageList({
  listRef,
  onScroll,
  renderItem,
  scrollEventThrottle = 16,
}: ChatMessageListProps) {
  const messages = useSelector(chatStore$.messages);

  const data = useMemo(() => {
    const arr = Array.isArray(messages) ? messages : [];
    return arr.filter(
      (m): m is ChatMessageType<never> => m != null,
    ) as AnyChatMessageType[];
  }, [messages]);

  const keyExtractor = useCallback(
    (item: AnyChatMessageType) => `${item.message_id}_${item.message_nonce}`,
    [],
  );

  const getItemType = useCallback((item: AnyChatMessageType) => {
    return item.isSpecialNotice ? 'notice' : 'regular';
  }, []);

  return (
    <FlashList
      data={data}
      ref={listRef}
      keyExtractor={keyExtractor}
      getItemType={getItemType}
      onScroll={onScroll}
      renderItem={renderItem}
      contentContainerStyle={styles.listContent}
      scrollEventThrottle={scrollEventThrottle}
      estimatedItemSize={ESTIMATED_ITEM_SIZE}
    />
  );
});

const styles = StyleSheet.create(theme => ({
  listContent: {
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.md,
  },
}));
