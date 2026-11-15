import { getChatColorStyle } from '@app/components/chat/util/chatColorStyles';
import type { MessageToken } from '@app/types/chat/messageToken';

import { styles } from '../ChatRow.styles';
import { ChatRowText } from '../ChatRowText';
import type { getChatTextStyles } from '../ChatText.styles';
import { getChatRowTextStyle } from '../util/chatRowTextStyle';

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
      <ChatRowText
        style={getChatRowTextStyle(
          'muted',
          textStyles.link,
          isModerated && styles.moderatedMessageText,
        )}
      >
        {token.content}
      </ChatRowText>
    );
  }

  return (
    <ChatRowText
      style={getChatRowTextStyle(
        'text',
        textStyles.body,
        textColor ? getChatColorStyle(textColor) : null,
        isModerated && styles.moderatedMessageText,
      )}
    >
      {token.content}
    </ChatRowText>
  );
}
