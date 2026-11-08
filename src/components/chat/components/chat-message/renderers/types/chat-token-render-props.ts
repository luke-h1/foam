import type { EmotePressData } from '@app/store/chat/types/chat-press-data';
import type { ChatDensity, ChatFontScale } from '@app/store/preference-store';
import type { UserNoticeTags } from '@app/types/chat/irc-tags/usernotice';
import type { MessageToken } from '@app/types/chat/messageToken';

export interface ChatTokenRenderProps {
  density: ChatDensity;
  disableEmoteAnimations: boolean;
  /**
   * Always set at the chat-row boundary (`fontScale ?? 'default'`).
   */
  fontScale: ChatFontScale;
  effectiveHighlightedUserSet: ReadonlySet<string>;
  getMentionColor?: (username: string) => string;
  onEmoteTouchStart?: (token: EmotePressData) => void;
  message: MessageToken[];
  isModerated: boolean;
  normalisedCurrentUsername?: string;
  noticeTags?: UserNoticeTags;
  parseTextForEmotes?: (text: string) => MessageToken[];
  replyPlainMentionTarget?: string;
  emoteTargetSize?: number;
  textColor?: string;
}
