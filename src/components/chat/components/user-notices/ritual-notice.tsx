import { memo } from 'react';
import { View } from 'react-native';

import { ChatText } from '@app/components/chat/components/chat-text/chat-text';
import { SymbolView } from '@app/components/ui/icon/icon';
import { reportUnrenderableNotice } from '@app/utils/chat/chat-health/report-unrenderable-notice';
import type { MessageToken } from '@app/utils/chat/message-token';

import { styles } from '../chat-message/chat-row.styles';
import { getChatTextStyles } from '../chat-message/chat-text.styles';
import { ChatNoticeMetaRow } from '../chat-message/renderers/chat-notice-meta-row';
import type { ChatFontScale } from '../chat-message/util/chat-scale';
import { CHAT_NOTICE_ACCENTS } from '../util/chat-notice-accents';
import { NoticeUserMessage } from './notice-user-message';

interface RitualNoticeProps {
  compact?: boolean;
  disableAnimations?: boolean;
  fontScale?: ChatFontScale;
  parsedMessage?: MessageToken[];
  token: MessageToken<'ritual'>;
}

function getRitualMetaLabel(ritualName: string): string {
  switch (ritualName) {
    case 'new_chatter':
      return 'New chatter';
    default:
      return ritualName ? ritualName.replaceAll('_', ' ') : 'Chat ritual';
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
        ? `${displayName} performed the ${ritualName.replaceAll('_', ' ')} ritual.`
        : `${displayName} performed a chat ritual.`;
  }
}

function RitualNoticeComponent({
  compact,
  disableAnimations,
  fontScale,
  parsedMessage,
  token,
}: RitualNoticeProps) {
  const textStyles = getChatTextStyles(fontScale, compact);
  const displayName = token.displayName?.trim();
  const systemMsg = token.systemMsg;
  const message = token.message?.trim() ?? '';

  const description =
    systemMsg ||
    (displayName ? getRitualDescription(token.ritualName, displayName) : '');

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
        {...{
          compact,
          fontScale,
          icon: getRitualIcon(token.ritualName),
          label: getRitualMetaLabel(token.ritualName),
          labelColor: CHAT_NOTICE_ACCENTS.ritual,
          labelStyle: styles.ritualNoticeMetaText,
        }}
      />
      {description ? (
        <ChatText style={[textStyles.body, styles.channelPointsMetaMuted]}>
          {description}
        </ChatText>
      ) : null}
      <NoticeUserMessage
        {...{ compact, disableAnimations, fontScale, message, parsedMessage }}
      />
    </View>
  );
}

export const RitualNotice = memo(RitualNoticeComponent);
