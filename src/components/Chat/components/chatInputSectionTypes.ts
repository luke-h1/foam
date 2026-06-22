import type { RefObject } from 'react';

import type { ChatConnectionFlags } from '@app/components/Chat/types/chatUiFlags';
import type { ParsedPart } from '@app/utils/chat/replaceTextWithEmotes';

import type { ChatComposerHandle } from './ChatComposer/ChatComposer';

export interface ReplyToData {
  messageId: string;
  username: string;
  message: string;
  /**
   * Parsed parts of the replied-to message so the preview can render its
   * emotes inline instead of showing their names as text.
   */
  messageParts?: ParsedPart[];
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
  onSubmit: () => void;
  onOpenEmoteSheet: () => void;
  onOpenSettingsSheet: () => void;
  onAttachImage?: () => void;
  isUploadingImage?: boolean;
  replyTo: ReplyToData | null;
  onClearReply: () => void;
  inputRef?: RefObject<ChatComposerHandle | null>;
}
