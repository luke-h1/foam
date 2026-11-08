import type { RefObject } from 'react';

import type { MessageToken } from '@app/types/chat/messageToken';

import type { ChatComposerHandle } from './chat-composer/hooks/use-chat-composer-controller';

export interface ReplyToData {
  messageId: string;
  username: string;
  message: string;
  messageParts?: MessageToken[];
  login: string;
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
