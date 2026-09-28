import { Text } from '@app/components/ui/text/text';

import { styles } from '../chat-row.styles';
import type { getChatTextStyles } from '../chat-text.styles';
import type { ChatTokenRenderProps } from './types/chat-token-render-props';

/**
 * A system line. Raid and unraid notices use the smaller meta style; every
 * other system line uses the body style.
 */
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
    <Text
      style={
        isRaidNotice
          ? [textStyles.meta, styles.raidNoticeText]
          : [textStyles.body, styles.systemMessageText]
      }
    >
      {content}
    </Text>
  );
}
