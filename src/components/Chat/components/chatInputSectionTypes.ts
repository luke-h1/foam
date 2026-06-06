import type {
  ChatConnectionFlags,
  ChatPinFlags,
} from '@app/components/Chat/types/chatUiFlags';
import type { SanitisedEmote } from '@app/types/emote';
import type { ChatComposerHandle } from './ChatComposer/ChatComposer';
import type { RefObject } from 'react';

export interface ReplyToData {
  messageId: string;
  username: string;
  message: string;
  replyParentUserLogin: string;
  parentMessage: string;
  color?: string;
  /**
   * Twitch user-id for 7TV paint lookup in the reply preview
   */
  userId?: string;
}

export interface ChatInputSectionProps {
  connection: ChatConnectionFlags;
  messageInput: string;
  onChangeText: (text: string) => void;
  onEmoteSelect: (emote: SanitisedEmote) => void;
  onSubmit: () => void;
  onOpenEmoteSheet: () => void;
  onOpenSettingsSheet: () => void;
  replyTo: ReplyToData | null;
  onClearReply: () => void;
  pin?: ChatPinFlags;
  inputRef?: RefObject<ChatComposerHandle | null>;
}
