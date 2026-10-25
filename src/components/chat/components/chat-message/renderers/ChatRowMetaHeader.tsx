import { CHAT_NOTICE_ACCENTS } from '@app/components/chat/components/util/chatNoticeAccents';
import type { MessageToken } from '@app/utils/chat/messageToken';

import { styles } from '../ChatRow.styles';
import { ChatNoticeMetaRow } from './ChatNoticeMetaRow';
import { ReplyingToHeader } from './ReplyingToHeader';
import type { ChatTokenRenderProps } from './types/chat-token-render-props';
import type { ReplyFlags } from './types/reply-flags';

interface ChatRowMetaHeaderProps {
  message: MessageToken[];
  onReplyContextPress?: (replyParentMessageId: string) => void;
  parentDisplayName: string | undefined;
  rendererArgs: Omit<ChatTokenRenderProps, 'message'>;
  replyBody: string | undefined;
  replyFlags: ReplyFlags;
  replyParentMessageId: string | undefined;
}

/**
 * The single meta row above a message. A reply header wins over the two
 * first-time badges, and only one of those two ever shows.
 */
export function ChatRowMetaHeader({
  message,
  onReplyContextPress,
  parentDisplayName,
  rendererArgs,
  replyBody,
  replyFlags,
  replyParentMessageId,
}: ChatRowMetaHeaderProps) {
  const { compact } = rendererArgs;

  const {
    canJumpToReplyTarget,
    isFirstMessage,
    isReplyingToCurrentUser,
    isReturningChatter,
    shouldRenderInlineReply,
  } = replyFlags;

  if (shouldRenderInlineReply && parentDisplayName) {
    return (
      <ReplyingToHeader
        rendererArgs={{ ...rendererArgs, message }}
        {...{
          canJumpToReplyTarget,
          isReplyingToCurrentUser,
          onReplyContextPress,
          parentDisplayName,
          replyBody,
          replyParentMessageId,
        }}
      />
    );
  }

  if (isFirstMessage) {
    return (
      <ChatNoticeMetaRow
        compact={compact}
        icon='sparkles'
        label='First message'
        labelColor={CHAT_NOTICE_ACCENTS.firstMessage}
        labelStyle={styles.firstMessageMetaText}
      />
    );
  }

  if (isReturningChatter) {
    return (
      <ChatNoticeMetaRow
        compact={compact}
        icon='arrow.uturn.left'
        label='Returning chatter'
        labelColor={CHAT_NOTICE_ACCENTS.returningChatter}
        labelStyle={styles.returningChatterMetaText}
      />
    );
  }

  return null;
}
