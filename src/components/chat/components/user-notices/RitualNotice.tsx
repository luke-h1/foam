import { memo } from 'react';
import { View } from 'react-native';

import { ChatText } from '@app/components/chat/components/chat-text/ChatText';
import { CHAT_NOTICE_ACCENTS } from '@app/components/chat/util/chatNoticeAccents';
import { SymbolView } from '@app/components/ui/icon/Icon';
import type { ChatDensity, ChatFontScale } from '@app/store/preference-store';
import type { MessageToken } from '@app/types/chat/messageToken';
import { reportUnrenderableNotice } from '@app/utils/chat/chat-health/reportUnrenderableNotice';

import { styles } from '../chat-message/ChatRow.styles';
import { getChatTextStyles } from '../chat-message/ChatText.styles';
import { ChatNoticeMetaRow } from '../chat-message/renderers/ChatNoticeMetaRow';
import { NoticeUserMessage } from './NoticeUserMessage';

interface RitualNoticeProps {
  density?: ChatDensity;
  disableEmoteAnimations?: boolean;
  fontScale?: ChatFontScale;
  messageTokens: MessageToken[];
  token: MessageToken<'ritual'>;
}

function isNewChatterRitual(ritualName: string): boolean {
  return ritualName === 'new_chatter';
}

function getRitualMetaLabel(ritualName: string): string {
  if (isNewChatterRitual(ritualName)) {
    return 'New chatter';
  }

  return ritualName ? ritualName.replaceAll('_', ' ') : 'Chat ritual';
}

function getRitualIcon(
  ritualName: string,
): React.ComponentProps<typeof SymbolView>['name'] {
  return isNewChatterRitual(ritualName) ? 'hand.wave.fill' : 'sparkles';
}

function getRitualDescription(ritualName: string, displayName: string): string {
  if (isNewChatterRitual(ritualName)) {
    return `${displayName} is new to the chat.`;
  }

  return ritualName
    ? `${displayName} performed the ${ritualName.replaceAll('_', ' ')} ritual.`
    : `${displayName} performed a chat ritual.`;
}

function RitualNoticeComponent({
  density,
  disableEmoteAnimations,
  fontScale,
  messageTokens,
  token,
}: RitualNoticeProps) {
  const textStyles = getChatTextStyles(fontScale, density);
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
          density,
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
        {...{
          density,
          disableEmoteAnimations,
          fontScale,
          tokens: messageTokens,
        }}
      />
    </View>
  );
}

export const RitualNotice = memo(RitualNoticeComponent);
