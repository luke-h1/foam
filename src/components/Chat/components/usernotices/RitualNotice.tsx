import { memo } from 'react';
import { View } from 'react-native';

import { SymbolView } from '@app/components/ui/Icon/Icon';
import { Text } from '@app/components/ui/Text/Text';
import i18next from '@app/i18n/i18next';
import type { ParsedPart } from '@app/utils/chat/parsedPart';

import { ChatNoticeMetaRow } from '../ChatMessage/renderers/ChatNoticeMetaRow';
import { styles } from '../ChatMessage/RichChatMessage.styles';
import { CHAT_NOTICE_ACCENTS } from '../util/chatNoticeAccents';

interface RitualNoticeProps {
  part: ParsedPart<'ritual'>;
}

function getRitualMetaLabel(ritualName: string): string {
  switch (ritualName) {
    case 'new_chatter':
      return i18next.t('chat:notices.newChatter');
    default:
      return ritualName
        ? ritualName.replace(/_/g, ' ')
        : i18next.t('chat:notices.chatRitual');
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
  const systemMsg = part.systemMsg;
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
