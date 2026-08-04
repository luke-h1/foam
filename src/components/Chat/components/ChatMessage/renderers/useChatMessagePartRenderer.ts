import type { Key } from 'react';

import type { UserNoticeTags } from '@app/types/chat/irc-tags/usernotice';
import type { ParsedPart } from '@app/utils/chat/parsedPart';

import type { ChatFontScale } from '../chatScale';
import type { EmotePressData } from '../RichChatMessage.types';

export interface UseChatMessagePartRendererArgs {
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
