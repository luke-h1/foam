import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import { getPartIdentity } from '@app/components/Chat/util/richChatMessage/getPartIdentity';
import { Text } from '@app/components/ui/Text/Text';
import type { ParsedPart } from '@app/utils/chat/parsedPart';

import {
  type ChatFontScale,
  densityFromCompact,
  getChatScale,
} from '../ChatMessage/chatScale';
import { getChatTextStyles } from '../ChatMessage/chatText.styles';
import { EmoteRenderer } from '../ChatMessage/renderers/EmoteRenderer';

interface NoticeUserMessageProps {
  compact?: boolean;
  disableAnimations?: boolean;
  fontScale?: ChatFontScale;
  message: string;
  parsedMessage?: ParsedPart[];
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
  const parts: ParsedPart[] =
    parsedMessage && parsedMessage.length > 0
      ? parsedMessage
      : [{ type: 'text', content: trimmed }];

  return (
    <View style={styles.row}>
      {parts.map((part, index) => {
        const key = getPartIdentity(part, index);

        switch (part.type) {
          case 'emote':
            return (
              <EmoteRenderer
                key={key}
                disableAnimations={disableAnimations}
                part={part}
                targetSize={scale.emoteSize}
              />
            );
          case 'text':
          case 'mention':
          case 'link':
          case 'cheermote':
          case 'stvEmote':
          case 'twitchClip':
            return (
              <Text key={key} color='gray.text' style={textStyles.body}>
                {part.content}
              </Text>
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
