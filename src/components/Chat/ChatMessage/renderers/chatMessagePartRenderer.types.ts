import type { Key } from 'react';

import type { UserNoticeTags } from '@app/types/chat/irc-tags/usernotice';
import type { ParsedPart } from '@app/utils/chat/replaceTextWithEmotes';

import type { EmotePressData } from '../RichChatMessage.types';

export interface UseChatMessagePartRendererArgs {
  compact: boolean;
  disableEmoteAnimations: boolean;
  effectiveHighlightedUserSet?: ReadonlySet<string>;
  getMentionColor?: (username: string) => string;
  getPartKey: (part: ParsedPart, index: number) => Key;
  onEmotePreview?: (part: EmotePressData) => void;
  message: ParsedPart[];
  moderationNotice?: unknown;
  normalisedCurrentUsername?: string;
  noticeTags?: UserNoticeTags;
  parseTextForEmotes?: (text: string) => ParsedPart[];
  replyPlainMentionTarget?: string;
  emoteTargetSize?: number;
}
