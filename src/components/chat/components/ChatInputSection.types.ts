import type { RefObject } from 'react';

import type { MessageToken } from '@app/types/chat/messageToken';

import type { ChatComposerHandle } from './chat-composer/hooks/use-chat-composer-controller';

export interface ReplyToData {
  messageId: string;
  username: string;
  message: string;
  /**
   * Parsed tokens of the replied-to message so the preview can render its
   * emotes inline instead of showing their names as text.
   */
  messageParts?: MessageToken[];
  replyParentUserLogin: string;
  color?: string;
  userId?: string;
}

export interface ChatInputSectionProps {
  isAuthenticated: boolean;
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
  includeHorizontalSafeArea?: boolean;
}
