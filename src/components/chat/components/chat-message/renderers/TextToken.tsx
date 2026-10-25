import { ChatText } from '@app/components/chat/components/chat-text/ChatText';
import { getChatColorStyle } from '@app/components/chat/util/chatColorStyles';
import type { MessageToken } from '@app/utils/chat/messageToken';

import { styles } from '../ChatRow.styles';
import type { getChatTextStyles } from '../ChatText.styles';

interface TextTokenProps {
  isModerated: boolean;
  textColor: string | undefined;
  textStyles: ReturnType<typeof getChatTextStyles>;
  token: MessageToken<'text' | 'link'>;
}

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
      <ChatText
        style={[textStyles.link, isModerated && styles.moderatedMessageText]}
      >
        {token.content}
      </ChatText>
    );
  }

  return (
    <ChatText
      color='gray.text'
      style={[
        textStyles.body,
        textColor ? getChatColorStyle(textColor) : null,
        isModerated && styles.moderatedMessageText,
      ]}
    >
      {token.content}
    </ChatText>
  );
}
