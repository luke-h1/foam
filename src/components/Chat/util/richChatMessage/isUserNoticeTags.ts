import type { ChatMessageType } from '@app/store/chat/types/constants';
import type { NoticeVariants } from '@app/types/chat/irc-tags/noticevariant';
import type {
  UserNoticeTags,
  UserNoticeVariantMap,
} from '@app/types/chat/irc-tags/usernotice';

/**
 * Every tag shape a chat message can carry, whatever its notice variant.
 */
type ChatMessageNoticeTags = ChatMessageType<
  NoticeVariants,
  keyof UserNoticeVariantMap
>['notice_tags'];

export function isUserNoticeTags(
  tags: ChatMessageNoticeTags,
): tags is UserNoticeTags {
  return tags !== undefined && 'msg-id' in tags;
}
