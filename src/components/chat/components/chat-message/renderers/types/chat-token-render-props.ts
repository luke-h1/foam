import type { Key } from 'react';

import type { EmotePressData } from '@app/components/chat/components/chat-message/chat-row.types';
import type { ChatFontScale } from '@app/components/chat/components/chat-message/util/chat-scale';
import type { UserNoticeTags } from '@app/types/chat/irc-tags/usernotice';
import type { MessageToken } from '@app/utils/chat/message-token';

export interface ChatTokenRenderProps {
  compact: boolean;
  disableEmoteAnimations: boolean;
  fontScale?: ChatFontScale | undefined;
  effectiveHighlightedUserSet?: ReadonlySet<string> | undefined;
  getMentionColor?: ((username: string) => string) | undefined;
  getTokenKey: (token: MessageToken, index: number) => Key;
  onEmoteTouchStart?: ((token: EmotePressData) => void) | undefined;
  message: MessageToken[];
  moderationNotice?: unknown | undefined;
  normalisedCurrentUsername?: string | undefined;
  noticeTags?: UserNoticeTags | undefined;
  parseTextForEmotes?: ((text: string) => MessageToken[]) | undefined;
  replyPlainMentionTarget?: string | undefined;
  emoteTargetSize?: number | undefined;
  textColor?: string | undefined;
}
