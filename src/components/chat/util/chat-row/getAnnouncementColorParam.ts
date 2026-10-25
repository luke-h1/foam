import type { ChatMessageType } from '@app/store/chat/types/constants';
import type { NoticeVariants } from '@app/types/chat/irc-tags/noticevariant';
import type { UserNoticeVariantMap } from '@app/types/chat/irc-tags/usernotice';

type NoticeTagBag = NonNullable<
  ChatMessageType<NoticeVariants, keyof UserNoticeVariantMap>['notice_tags']
>;

export function getAnnouncementColorParam(
  noticeTags: NoticeTagBag | undefined,
): string | undefined {
  if (noticeTags === undefined || !('msg-param-color' in noticeTags)) {
    return undefined;
  }

  const color = noticeTags['msg-param-color'];

  return color === true || color === false ? undefined : color;
}
