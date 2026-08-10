import { memo } from 'react';
import { View } from 'react-native';

import { SymbolView } from '@app/components/ui/Icon/Icon';
import { Text } from '@app/components/ui/Text/Text';
import i18next from '@app/i18n/i18next';
import { reportUnrenderableNotice } from '@app/utils/chat/chatHealth/reportUnrenderableNotice';
import type { ParsedPart } from '@app/utils/chat/parsedPart';

import type { ChatFontScale } from '../ChatMessage/chatScale';
import { getChatTextStyles } from '../ChatMessage/chatText.styles';
import { ChatNoticeMetaRow } from '../ChatMessage/renderers/ChatNoticeMetaRow';
import { styles } from '../ChatMessage/RichChatMessage.styles';
import { CHAT_NOTICE_ACCENTS } from '../util/chatNoticeAccents';
import { NoticeUserMessage } from './NoticeUserMessage';

interface RitualNoticeProps {
  compact?: boolean;
  disableAnimations?: boolean;
  fontScale?: ChatFontScale;
  parsedMessage?: ParsedPart[];
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

function RitualNoticeComponent({
  compact,
  disableAnimations,
  fontScale,
  parsedMessage,
  part,
}: RitualNoticeProps) {
  const textStyles = getChatTextStyles(fontScale, compact);
  const displayName = part.displayName?.trim();
  const systemMsg = part.systemMsg;
  const message = part.message?.trim() ?? '';
  const description =
    systemMsg ||
    (displayName ? getRitualDescription(part.ritualName, displayName) : '');

  if (!description && !message) {
    reportUnrenderableNotice({
      msgId: 'ritual',
      reason: 'empty-body',
      stage: 'render',
    });
    return null;
  }

  return (
    <View style={styles.messageColumn}>
      <ChatNoticeMetaRow
        compact={compact}
        fontScale={fontScale}
        icon={getRitualIcon(part.ritualName)}
        label={getRitualMetaLabel(part.ritualName)}
        labelColor={CHAT_NOTICE_ACCENTS.ritual}
        labelStyle={styles.ritualNoticeMetaText}
      />
      {description ? (
        <Text style={[textStyles.body, styles.channelPointsMetaMuted]}>
          {description}
        </Text>
      ) : null}
      <NoticeUserMessage
        compact={compact}
        disableAnimations={disableAnimations}
        fontScale={fontScale}
        message={message}
        parsedMessage={parsedMessage}
      />
    </View>
  );
}

export const RitualNotice = memo(RitualNoticeComponent);
