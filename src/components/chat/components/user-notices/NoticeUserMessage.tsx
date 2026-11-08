import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import { ChatText } from '@app/components/chat/components/chat-text/ChatText';
import { getTokenIdentity } from '@app/components/chat/util/chat-row/getTokenIdentity';
import type { ChatDensity, ChatFontScale } from '@app/store/preference-store';
import type { MessageToken } from '@app/types/chat/messageToken';

import { getChatTextStyles } from '../chat-message/ChatText.styles';
import { EmoteToken } from '../chat-message/renderers/EmoteToken';
import { getChatScale } from '../chat-message/util/chatScale';

interface NoticeUserMessageProps {
  density?: ChatDensity;
  disableEmoteAnimations?: boolean;
  fontScale?: ChatFontScale;
  tokens: MessageToken[];
}

function NoticeUserMessageComponent({
  density,
  disableEmoteAnimations = false,
  fontScale,
  tokens,
}: NoticeUserMessageProps) {
  if (tokens.length === 0) {
    return null;
  }

  const textStyles = getChatTextStyles(fontScale, density);
  const scale = getChatScale(fontScale, density);

  return (
    <View style={styles.row}>
      {tokens.map((token, index) => {
        const key = getTokenIdentity(token, index);

        switch (token.type) {
          case 'emote':
            return (
              <EmoteToken
                key={key}
                disableAnimations={disableEmoteAnimations}
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
