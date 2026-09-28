import type { Key } from 'react';

import type { EmotePressData } from '@app/components/chat/components/chat-message/chat-row.types';
import type { ChatFontScale } from '@app/components/chat/components/chat-message/util/chat-scale';
import type { UserNoticeTags } from '@app/types/chat/irc-tags/usernotice';
import type { MessageToken } from '@app/utils/chat/message-token';

export interface ChatTokenRenderProps {
  compact: boolean;
  disableEmoteAnimations: boolean;
  fontScale?: ChatFontScale;
  effectiveHighlightedUserSet?: ReadonlySet<string>;
  getMentionColor?: (username: string) => string;
  getTokenKey: (token: MessageToken, index: number) => Key;
  onEmoteTouchStart?: (token: EmotePressData) => void;
  message: MessageToken[];
  moderationNotice?: unknown;
  normalisedCurrentUsername?: string;
  noticeTags?: UserNoticeTags;
  parseTextForEmotes?: (text: string) => MessageToken[];
  replyPlainMentionTarget?: string;
  emoteTargetSize?: number;
  textColor?: string;
}
