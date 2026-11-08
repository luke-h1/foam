import { type StyleProp, type TextStyle } from 'react-native';

import { ChatText } from '@app/components/chat/components/chat-text/ChatText';

import { styles } from '../chat-message/ChatRow.styles';

export function MilestoneSystemMessage({
  lead,
  rest,
  style,
}: {
  lead: string | undefined;
  rest: string | undefined;
  style: StyleProp<TextStyle>;
}) {
  return (
    <ChatText style={style}>
      {lead ? (
        <ChatText style={[style, styles.channelPointsMetaName]}>
          {lead}
        </ChatText>
      ) : null}
      {rest ? (
        <ChatText style={[style, styles.channelPointsMetaMuted]}>
          {lead ? ` ${rest}` : rest}
        </ChatText>
      ) : null}
    </ChatText>
  );
}
