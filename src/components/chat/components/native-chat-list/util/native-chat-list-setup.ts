import type {
  BadgePressData,
  EmotePressData,
  MessageActionData,
  UsernamePressData,
} from '@app/store/chat/types/chat-press-data';
import type { NativeChatListConfig } from '@modules/native-chat-list/src/NativeChatList.types';

import type { NativeChatRowContext } from './native-row-context';

export interface NativeChatRowHandlers {
  onBadgePress: (badge: BadgePressData) => void;
  onEmotePress: (emote: EmotePressData) => void;
  onMessageLongPress: (data: MessageActionData<'usernotice'>) => void;
  onReplyContextPress: (replyParentMessageId: string) => void;
  onUsernamePress: (data: UsernamePressData) => void;
}

/**
 * What the native list needs from the chat surface besides the messages.
 */
export interface NativeChatListSetup {
  config: NativeChatListConfig;
  rowContext: NativeChatRowContext;
  rowHandlers: NativeChatRowHandlers;
}
