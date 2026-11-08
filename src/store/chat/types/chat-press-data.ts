import type { ChatMessageType } from '@app/types/chat/chatMessage';
import type { NoticeVariants } from '@app/types/chat/irc-tags/noticevariant';
import type { UserNoticeVariantMap } from '@app/types/chat/irc-tags/usernotice';
import type { MessageToken } from '@app/types/chat/messageToken';
import type { SanitisedBadgeSet } from '@app/types/twitch/badge';

export type EmotePressData = MessageToken<'emote'>;
export type BadgePressData = SanitisedBadgeSet;

export type MessageActionData<
  TNoticeType extends NoticeVariants,
  TVariant extends (TNoticeType extends 'usernotice'
    ? keyof UserNoticeVariantMap
    : never) = never,
> = {
  message: MessageToken[];
  username?: string;
  login?: string;
  userId?: string;
  messageData: ChatMessageType<TNoticeType, TVariant>;
};

export interface UsernamePressData {
  color?: string;
  login?: string;
  userId?: string;
  username: string;
}
