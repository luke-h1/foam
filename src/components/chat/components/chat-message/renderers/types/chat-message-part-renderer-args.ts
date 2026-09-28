import type { Key } from 'react';

import type { EmotePressData } from '@app/components/chat/components/chat-message/rich-chat-message.types';
import type { ChatFontScale } from '@app/components/chat/components/chat-message/util/chat-scale';
import type { UserNoticeTags } from '@app/types/chat/irc-tags/usernotice';
import type { ParsedPart } from '@app/utils/chat/parsed-part';

export interface ChatMessagePartRendererArgs {
  compact: boolean;
  disableEmoteAnimations: boolean;
  fontScale?: ChatFontScale;
  effectiveHighlightedUserSet?: ReadonlySet<string>;
  getMentionColor?: (username: string) => string;
  getPartKey: (part: ParsedPart, index: number) => Key;
  onEmoteTouchStart?: (part: EmotePressData) => void;
  message: ParsedPart[];
  moderationNotice?: unknown;
  normalisedCurrentUsername?: string;
  noticeTags?: UserNoticeTags;
  parseTextForEmotes?: (text: string) => ParsedPart[];
  replyPlainMentionTarget?: string;
  emoteTargetSize?: number;
  textColor?: string;
}
