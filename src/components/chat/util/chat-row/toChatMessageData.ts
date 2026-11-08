import type { ChatRowProps } from '@app/components/chat/components/chat-message/ChatRow.types';
import { CHAT_ROW_RENDER_PROP_KEYS } from '@app/components/chat/components/chat-message/util/chatRowRenderPropKeys';
import type { ChatMessageType } from '@app/types/chat/chatMessage';
import type { NoticeVariants } from '@app/types/chat/irc-tags/noticevariant';
import type { UserNoticeVariantMap } from '@app/types/chat/irc-tags/usernotice';

export function toChatMessageData<
  TNoticeType extends NoticeVariants,
  TVariant extends (TNoticeType extends 'usernotice'
    ? keyof UserNoticeVariantMap
    : never) = never,
>(
  props: ChatRowProps<TNoticeType, TVariant>,
): ChatMessageType<TNoticeType, TVariant> {
  const messageData = Object.fromEntries(
    Object.entries(props).filter(
      ([key]) => !Object.hasOwn(CHAT_ROW_RENDER_PROP_KEYS, key),
    ),
  );

  // SAFETY: ChatRowProps is ChatMessageType & ChatRowRenderProps, and
  // CHAT_ROW_RENDER_PROP_KEYS names every render prop.
  return messageData as ChatMessageType<TNoticeType, TVariant>;
}
