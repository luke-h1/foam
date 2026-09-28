import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import { getPartIdentity } from '@app/components/chat/util/rich-chat-message/get-part-identity';
import { Text } from '@app/components/ui/text/text';
import type { ParsedPart } from '@app/utils/chat/parsed-part';

import { getChatTextStyles } from '../chat-message/chat-text.styles';
import { EmoteRenderer } from '../chat-message/renderers/emote-renderer';
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
