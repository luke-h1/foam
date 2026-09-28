import { getChatColorStyle } from '@app/components/chat/util/chat-color-styles';
import { Text } from '@app/components/ui/text/text';
import type { MessageToken } from '@app/utils/chat/message-token';

import { styles } from '../chat-row.styles';
import type { getChatTextStyles } from '../chat-text.styles';

interface TextTokenProps {
  isModerated: boolean;
  textColor: string | undefined;
  textStyles: ReturnType<typeof getChatTextStyles>;
  token: MessageToken<'text' | 'link'>;
}

/**
 * A run of message text. A link gets the link style; everything else gets the
 * body style and the sender's colour. An all-whitespace run renders nothing.
 */
export function TextToken({
  isModerated,
  textColor,
  textStyles,
  token,
}: TextTokenProps) {
  if (!token.content.trim()) {
    return null;
  }

  if (token.type === 'link') {
    return (
      <Text
        style={[textStyles.link, isModerated && styles.moderatedMessageText]}
      >
        {token.content}
      </Text>
    );
  }

  return (
    <Text
      color='gray.text'
      style={[
        textStyles.body,
        textColor ? getChatColorStyle(textColor) : null,
        isModerated && styles.moderatedMessageText,
      ]}
    >
      {token.content}
    </Text>
  );
}
