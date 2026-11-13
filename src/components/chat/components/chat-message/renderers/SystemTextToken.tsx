import { styles } from '../ChatRow.styles';
import { ChatRowText } from '../ChatRowText';
import type { getChatTextStyles } from '../ChatText.styles';
import { getChatRowTextStyle } from '../util/chatRowTextStyle';
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
    <ChatRowText
      style={
        isRaidNotice
          ? getChatRowTextStyle('muted', textStyles.meta, styles.raidNoticeText)
          : getChatRowTextStyle(
              'muted',
              textStyles.body,
              styles.systemMessageText,
            )
      }
    >
      {content}
    </ChatRowText>
  );
}
