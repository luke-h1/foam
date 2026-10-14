import type { ChatListRef } from '@app/components/chat/components/chat-list';
import type { AnyChatMessageType } from '@app/store/chat/types/constants';
import { getChatMessageListKey } from '@app/utils/chat/message-identity/get-chat-message-list-key';
import type { NativeChatListViewHandle } from '@modules/native-chat-list/src/NativeChatList.types';

function unsupported(): never {
  throw new Error('The native chat list does not support this list call.');
}

/**
 * Chat code drives the list through `ChatListRef`. It calls only
 * `scrollToEnd` and `scrollToItem`, so the native list maps those two and
 * throws on the rest. The one exception is `reportContentInset`:
 * `useKeyboardChatComposerInset` calls it on every composer resize. The native
 * list already gets that height from the `composerInset` prop, so the call
 * does nothing.
 */
export function createNativeChatListRef(
  getView: () => NativeChatListViewHandle | null,
): ChatListRef {
  return {
    scrollToEnd: async options => {
      await getView()?.scrollToEnd(options?.animated ?? false);
    },
    scrollToItem: async ({
      animated,
      item,
      viewPosition,
    }: {
      animated?: boolean;
      item: AnyChatMessageType;
      viewPosition?: number;
    }) => {
      await getView()?.scrollToKey(
        getChatMessageListKey(item),
        animated ?? true,
        viewPosition ?? 0,
      );
    },
    clearCaches: unsupported,
    flashScrollIndicators: unsupported,
    getAnimatableRef: unsupported,
    getNativeScrollRef: unsupported,
    getScrollableNode: unsupported,
    getScrollResponder: unsupported,
    getState: unsupported,
    reportContentInset: () => {},
    scrollIndexIntoView: unsupported,
    scrollItemIntoView: unsupported,
    scrollToIndex: unsupported,
    scrollToOffset: unsupported,
    setItemSize: unsupported,
    setScrollProcessingEnabled: unsupported,
    setVisibleContentAnchorOffset: unsupported,
  };
}
