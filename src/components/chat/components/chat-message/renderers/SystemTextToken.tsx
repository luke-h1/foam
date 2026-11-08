import { ChatText } from '@app/components/chat/components/chat-text/ChatText';

import { styles } from '../ChatRow.styles';
import type { getChatTextStyles } from '../ChatText.styles';
import type { ChatTokenRenderProps } from './types/chat-token-render-props';

export function SystemTextToken({
  content,
  noticeTags,
  textStyles,
}: {
  content: string;
  noticeTags: ChatTokenRenderProps['noticeTags'];
  textStyles: ReturnType<typeof getChatTextStyles>;
}) {
  if (!content.trim()) {
    return null;
  }

  const isRaidNotice =
    noticeTags?.['msg-id'] === 'raid' || noticeTags?.['msg-id'] === 'unraid';

  return (
    <ChatText
      style={
        isRaidNotice
          ? [textStyles.meta, styles.raidNoticeText]
          : [textStyles.body, styles.systemMessageText]
      }
    >
      {content}
    </ChatText>
  );
}
