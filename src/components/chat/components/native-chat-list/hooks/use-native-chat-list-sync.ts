import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';

import type { AnyChatMessageType } from '@app/store/chat/types/constants';
import { isRenderableChatMessage } from '@app/utils/chat/message-identity/is-renderable-chat-message';
import type { NativeChatListViewHandle } from '@modules/native-chat-list/src/NativeChatList.types';

import {
  createNativeChatListBatch,
  type NativeChatListSentState,
} from '../util/create-native-chat-list-batch';
import type {
  NativeChatRowContext,
  NativeChatRowLiveState,
} from '../util/native-row-context';

interface UseNativeChatListSyncOptions {
  context: NativeChatRowContext;
  dataKey: string;
  live: NativeChatRowLiveState;
  messages: readonly AnyChatMessageType[];
  viewRef: RefObject<NativeChatListViewHandle | null>;
}

/**
 * Sends the native list one batch per change to the visible messages or the
 * live store values. A flush that trims the top and appends at the bottom
 * becomes a small incremental batch; a channel switch, a filter change or a
 * new row context resets the list.
 */
export function useNativeChatListSync({
  context,
  dataKey,
  live,
  messages,
  viewRef,
}: UseNativeChatListSyncOptions) {
  const sentRef = useRef<NativeChatListSentState | null>(null);

  useEffect(() => {
    const view = viewRef.current;

    if (!view) {
      return;
    }

    const { batch, sent } = createNativeChatListBatch({
      context,
      dataKey,
      live,
      messages: messages.filter(isRenderableChatMessage),
      sent: sentRef.current,
    });

    sentRef.current = sent;

    if (batch) {
      void view.apply(batch);
    }
  }, [context, dataKey, live, messages, viewRef]);

  return sentRef;
}
