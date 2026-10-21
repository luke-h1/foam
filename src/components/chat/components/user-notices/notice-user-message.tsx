import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import { ChatText } from '@app/components/chat/components/chat-text/chat-text';
import { getTokenIdentity } from '@app/components/chat/util/chat-row/get-token-identity';
import type { MessageToken } from '@app/utils/chat/message-token';

import { getChatTextStyles } from '../chat-message/chat-text.styles';
import { EmoteToken } from '../chat-message/renderers/emote-token';
import {
  type ChatFontScale,
  densityFromCompact,
  getChatScale,
} from '../chat-message/util/chat-scale';

interface NoticeUserMessageProps {
  compact?: boolean;
  disableAnimations?: boolean;
  fontScale?: ChatFontScale;
  message: string;
  parsedMessage?: MessageToken[];
}

function NoticeUserMessageComponent({
  compact,
  disableAnimations = false,
  fontScale,
  message,
  parsedMessage,
}: NoticeUserMessageProps) {
  const trimmed = message.trim();

  if (!trimmed) {
    return null;
  }

  const textStyles = getChatTextStyles(fontScale, compact);
  const scale = getChatScale(fontScale, densityFromCompact(compact));

  const tokens: MessageToken[] =
    parsedMessage && parsedMessage.length > 0
      ? parsedMessage
      : [{ type: 'text', content: trimmed }];

  return (
    <View style={styles.row}>
      {tokens.map((token, index) => {
        const key = getTokenIdentity(token, index);

        switch (token.type) {
          case 'emote':
            return (
              <EmoteToken
                key={key}
                disableAnimations={disableAnimations}
                token={token}
                targetSize={scale.emoteSize}
              />
            );
          case 'text':
          case 'mention':
          case 'link':
          case 'cheermote':
          case 'stvEmoteLink':
          case 'twitchClip':
            return (
              <ChatText key={key} color='gray.text' style={textStyles.body}>
                {token.content}
              </ChatText>
            );
          default:
            return null;
        }
      })}
    </View>
  );
}

export const NoticeUserMessage = memo(NoticeUserMessageComponent);

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
  },
});
