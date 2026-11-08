import { memo } from 'react';
import { type StyleProp, StyleSheet, type TextStyle } from 'react-native';

import { MessageTokenLine } from '@app/components/chat/components/message-token-line/MessageTokenLine';
import type { MessageToken } from '@app/types/chat/messageToken';

/**
 * The preview shows one line, so tokens past this count never show. The cap
 * keeps a long message from mounting views that the clip hides.
 */
const REPLY_PREVIEW_MAX_TOKENS = 24;

interface ReplyPreviewBodyProps {
  tokens: MessageToken[];
  textStyle: StyleProp<TextStyle>;
  lineHeight: number;
}

function ReplyPreviewBodyComponent({
  tokens,
  textStyle,
  lineHeight,
}: ReplyPreviewBodyProps) {
  return (
    <MessageTokenLine
      emoteSize={lineHeight - 2}
      style={[styles.line, { maxHeight: lineHeight }]}
      textStyle={textStyle}
      tokens={tokens.slice(0, REPLY_PREVIEW_MAX_TOKENS)}
    />
  );
}

export const ReplyPreviewBody = memo(ReplyPreviewBodyComponent);

const styles = StyleSheet.create({
  line: {
    overflow: 'hidden',
  },
});
