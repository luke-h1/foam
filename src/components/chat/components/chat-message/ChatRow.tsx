import { memo } from 'react';

import { useChatRow } from '@app/components/chat/components/chat-message/hooks/use-chat-row';
import type { NoticeVariants } from '@app/types/chat/irc-tags/noticevariant';
import type { UserNoticeVariantMap } from '@app/types/chat/irc-tags/usernotice';

import type { ChatRowProps } from './ChatRow.types';
import { ChatRowBody } from './ChatRowBody';
import { ChatRowSurface } from './ChatRowSurface';

function ChatRowComponent<
  TNoticeType extends NoticeVariants,
  TVariant extends (TNoticeType extends 'usernotice'
    ? keyof UserNoticeVariantMap
    : never) = never,
>(props: ChatRowProps<TNoticeType, TVariant>) {
  const state = useChatRow(props);

  return (
    <ChatRowSurface state={state}>
      <ChatRowBody state={state} />
    </ChatRowSurface>
  );
}

export const ChatRow =
  // SAFETY: memo() erases generics. It forwards the same props to ChatRowComponent, so the wrapper keeps its call signature.
  memo(ChatRowComponent) as typeof ChatRowComponent;
