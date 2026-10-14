import { useLayoutEffect, useRef, useState } from 'react';
import { type NativeSyntheticEvent, StyleSheet } from 'react-native';
import type { RefObject } from 'react';
import { type SharedValue, useAnimatedReaction } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { useChatRowLiveState } from '@app/store/chat/react/use-chat-row-live-state';
import type { AnyChatMessageType } from '@app/store/chat/types/constants';
import { getChatMessageListKey } from '@app/utils/chat/message-identity/get-chat-message-list-key';
import { normalizeSevenTvBadge } from '@app/utils/seven-tv/cosmetics/normalize-seven-tv-badge';
import type {
  NativeChatListViewHandle,
  NativeChatRowPressPayload,
} from '@modules/native-chat-list/src/NativeChatList.types';
import { NativeChatListView } from '@modules/native-chat-list/src/NativeChatListView';

import type { ChatListRef, ChatListScrollHandlers } from '../chat-list';
import { useNativeChatListSync } from './hooks/use-native-chat-list-sync';
import { createNativeChatListRef } from './util/create-native-chat-list-ref';
import type { NativeChatListSetup } from './util/native-chat-list-setup';

interface NativeChatListProps {
  /**
   * Height of the composer that floats over the list bottom.
   */
  composerInset: SharedValue<number>;
  data: readonly AnyChatMessageType[];
  dataKey: string;
  listRef: RefObject<ChatListRef | null>;
  onViewableMessagesChange?: (messages: AnyChatMessageType[]) => void;
  scrollHandlers: ChatListScrollHandlers;
  setup: NativeChatListSetup;
}

/**
 * The chat message list drawn by UIKit (`modules/native-chat-list`). JS keeps
 * the store, filters and sheets; the native list owns scrolling, layout and
 * drawing, and reports presses back by message key.
 */
export function NativeChatList({
  composerInset,
  data,
  dataKey,
  listRef,
  onViewableMessagesChange,
  scrollHandlers,
  setup,
}: NativeChatListProps) {
  const { config, rowContext, rowHandlers } = setup;
  const viewRef = useRef<NativeChatListViewHandle>(null);
  const [composerInsetValue, setComposerInsetValue] = useState(() =>
    composerInset.get(),
  );

  const live = useChatRowLiveState(rowContext.channelId);

  const sentRef = useNativeChatListSync({
    context: rowContext,
    dataKey,
    live,
    messages: data,
    viewRef,
  });

  useAnimatedReaction(
    () => composerInset.get(),
    (next, previous) => {
      if (next !== previous) {
        scheduleOnRN(setComposerInsetValue, next);
      }
    },
  );

  useLayoutEffect(() => {
    listRef.current = createNativeChatListRef(() => viewRef.current);

    return () => {
      listRef.current = null;
    };
  }, [listRef]);

  const findMessage = (key: string) =>
    sentRef.current?.messages.find(
      message => getChatMessageListKey(message) === key,
    );

  const handleRowPress = ({
    nativeEvent,
  }: NativeSyntheticEvent<NativeChatRowPressPayload>) => {
    const message = findMessage(nativeEvent.key);

    if (!message) {
      return;
    }

    const { userstate } = message;
    const replyParentMessageId = userstate['reply-parent-msg-id'];

    if (nativeEvent.target === 'reply' && replyParentMessageId) {
      rowHandlers.onReplyContextPress(replyParentMessageId);
      return;
    }

    if (nativeEvent.target === 'username' && userstate.username) {
      rowHandlers.onUsernamePress({
        username: userstate.username,
        login: userstate.login,
        userId: userstate['user-id'],
        color: userstate.color,
      });
      return;
    }

    const badge =
      nativeEvent.target === 'badge'
        ? message.badges[nativeEvent.index]
        : undefined;

    if (badge) {
      rowHandlers.onBadgePress(normalizeSevenTvBadge(badge));
    }
  };

  const handleRowLongPress = ({
    nativeEvent,
  }: NativeSyntheticEvent<NativeChatRowPressPayload>) => {
    const message = findMessage(nativeEvent.key);

    if (!message) {
      return;
    }

    const token =
      nativeEvent.target === 'emote'
        ? message.message[nativeEvent.index]
        : undefined;

    if (token?.type === 'emote') {
      rowHandlers.onEmotePress(token);
      return;
    }

    const { notice_tags: _noticeTags, ...messageData } = message;

    rowHandlers.onMessageLongPress({
      message: message.message,
      username: message.userstate.username,
      login: message.userstate.login,
      userId: message.userstate['user-id'],
      messageData,
    });
  };

  const handleVisibleKeysChange = ({
    nativeEvent,
  }: NativeSyntheticEvent<{ keys: string[] }>) => {
    if (!onViewableMessagesChange) {
      return;
    }

    const visibleKeys = new Set(nativeEvent.keys);
    const messages = sentRef.current?.messages ?? [];

    onViewableMessagesChange(
      messages.filter(message =>
        visibleKeys.has(getChatMessageListKey(message)),
      ),
    );
  };

  if (!NativeChatListView) {
    return null;
  }

  return (
    <NativeChatListView
      ref={viewRef}
      composerInset={composerInsetValue}
      config={config}
      onEndReached={scrollHandlers.onEndReached}
      onMomentumScrollBegin={scrollHandlers.onMomentumScrollBegin}
      onMomentumScrollEnd={scrollHandlers.onMomentumScrollEnd}
      onRowLongPress={handleRowLongPress}
      onRowPress={handleRowPress}
      onScroll={scrollHandlers.onScroll}
      onScrollBeginDrag={scrollHandlers.onScrollBeginDrag}
      onScrollEndDrag={scrollHandlers.onScrollEndDrag}
      onVisibleKeysChange={handleVisibleKeysChange}
      style={styles.list}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    flex: 1,
  },
});
