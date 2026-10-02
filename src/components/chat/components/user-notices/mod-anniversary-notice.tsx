import { memo } from 'react';
import { View } from 'react-native';

import { ChatText } from '@app/components/chat/components/chat-text/chat-text';
import { reportUnrenderableNotice } from '@app/utils/chat/chat-health/report-unrenderable-notice';
import { MessageToken } from '@app/utils/chat/message-token';

import { styles } from '../chat-message/chat-row.styles';
import { getChatTextStyles } from '../chat-message/chat-text.styles';
import { ChatNoticeMetaRow } from '../chat-message/renderers/chat-notice-meta-row';
import type { ChatFontScale } from '../chat-message/util/chat-scale';
import { CHAT_NOTICE_ACCENTS } from '../util/chat-notice-accents';
import { NoticeUserMessage } from './notice-user-message';
import { splitNoticeSubject } from './util/notice-sentence';

interface ModAnniversaryNoticeProps {
  compact?: boolean;
  disableAnimations?: boolean;
  fontScale?: ChatFontScale;
  parsedMessage?: MessageToken[];
  token: MessageToken<'modiversary'>;
}

function ModAnniversaryNoticeComponent({
  compact,
  disableAnimations,
  fontScale,
  parsedMessage,
  token,
}: ModAnniversaryNoticeProps) {
  const textStyles = getChatTextStyles(fontScale, compact);
  const displayName = token.displayName?.trim() || '';
  const systemMsg = token.systemMsg?.trim() || '';
  const content = token.content?.trim() || '';

  if (!systemMsg && !content) {
    reportUnrenderableNotice({
      msgId: 'modiversary',
      reason: 'empty-body',
      stage: 'render',
    });
    return null;
  }

  const { lead, rest } = splitNoticeSubject(systemMsg, displayName);

  return (
    <View style={styles.messageColumn}>
      <ChatNoticeMetaRow
        compact={compact}
        fontScale={fontScale}
        icon='shield.fill'
        label='Mod anniversary'
        labelColor={CHAT_NOTICE_ACCENTS.modAnniversary}
        labelStyle={styles.modAnniversaryMetaText}
      />
      {systemMsg ? (
        <ChatText style={textStyles.meta}>
          {lead ? (
            <ChatText style={[textStyles.meta, styles.channelPointsMetaName]}>
              {lead}
            </ChatText>
          ) : null}
          {rest ? (
            <ChatText style={[textStyles.meta, styles.channelPointsMetaMuted]}>
              {lead ? ` ${rest}` : rest}
            </ChatText>
          ) : null}
        </ChatText>
      ) : null}
      <NoticeUserMessage
        compact={compact}
        disableAnimations={disableAnimations}
        fontScale={fontScale}
        message={content}
        parsedMessage={parsedMessage}
      />
    </View>
  );
}

export const ModAnniversaryNotice = memo(ModAnniversaryNoticeComponent);
