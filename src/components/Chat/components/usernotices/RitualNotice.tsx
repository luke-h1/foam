import { memo } from 'react';
import { Text } from '@app/components/ui/Text/Text';
import type { ParsedPart } from '@app/utils/chat/replaceTextWithEmotes';
import { unescapeIrcTag } from '@app/utils/chat/unescapeIrcTag';
import { SymbolView } from 'expo-symbols';
import { View } from 'react-native';

import { CHAT_NOTICE_ACCENTS } from '../util/chatNoticeAccents';
import { ChatNoticeMetaRow } from '../ChatMessage/renderers/ChatNoticeMetaRow';
import { styles } from '../ChatMessage/RichChatMessage.styles';

interface RitualNoticeProps {
  part: ParsedPart<'ritual'>;
}

function getRitualMetaLabel(ritualName: string): string {
  switch (ritualName) {
    case 'new_chatter':
      return 'New chatter';
    default:
      return ritualName ? ritualName.replace(/_/g, ' ') : 'Chat ritual';
  }
}

function getRitualIcon(
  ritualName: string,
): React.ComponentProps<typeof SymbolView>['name'] {
  return ritualName === 'new_chatter' ? 'hand.wave.fill' : 'sparkles';
}

function getRitualDescription(ritualName: string, displayName: string): string {
  switch (ritualName) {
    case 'new_chatter':
      return `${displayName} is new to the chat.`;
    default:
      return ritualName
        ? `${displayName} performed the ${ritualName.replace(/_/g, ' ')} ritual.`
        : `${displayName} performed a chat ritual.`;
  }
}

function RitualNoticeComponent({ part }: RitualNoticeProps) {
  const displayName = part.displayName?.trim();
  const systemMsg = unescapeIrcTag(part.systemMsg);
  const message = part.message?.trim();
  const description =
    systemMsg ||
    (displayName ? getRitualDescription(part.ritualName, displayName) : '');

  if (!description && !message) {
    return null;
  }

  return (
    <View style={styles.messageColumn}>
      <ChatNoticeMetaRow
        icon={getRitualIcon(part.ritualName)}
        label={getRitualMetaLabel(part.ritualName)}
        labelColor={CHAT_NOTICE_ACCENTS.ritual}
        labelStyle={styles.ritualNoticeMetaText}
      />
      {description ? (
        <Text style={[styles.messageText, styles.channelPointsMetaMuted]}>
          {description}
        </Text>
      ) : null}
      {message ? (
        <Text color='gray.text' style={styles.messageText}>
          {message}
        </Text>
      ) : null}
    </View>
  );
}

export const RitualNotice = memo(RitualNoticeComponent);
