import type { ChatMessageType } from '@app/store/chat/types/constants';
import type { NoticeVariants } from '@app/types/chat/irc-tags/noticevariant';
import type { UserNoticeVariantMap } from '@app/types/chat/irc-tags/usernotice';
import type { SanitisedBadgeSet } from '@app/types/twitch/badge';
import type { ParsedPart } from '@app/utils/chat/parsedPart';

/**
 * The payloads a chat row hands to the overlay layer on press; store-side
 * because the overlay observables carry them.
 */
export type EmotePressData = ParsedPart<'emote'>;
export type BadgePressData = SanitisedBadgeSet;
export type MessageActionData<
  TNoticeType extends NoticeVariants,
  TVariant extends (TNoticeType extends 'usernotice'
    ? keyof UserNoticeVariantMap
    : never) = never,
> = {
  message: ParsedPart[];
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
