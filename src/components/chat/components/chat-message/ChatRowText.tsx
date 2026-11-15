import { Text as RNText, type TextProps, type TextStyle } from 'react-native';

import { CHAT_TEXT_SPAN_DEFAULTS } from '@app/components/chat/components/chat-text/util/chatTextStyle';

interface ChatRowTextProps extends Omit<TextProps, 'style'> {
  style: TextStyle;
}

export function ChatRowText(props: ChatRowTextProps) {
  return <RNText {...CHAT_TEXT_SPAN_DEFAULTS} {...props} />;
}
