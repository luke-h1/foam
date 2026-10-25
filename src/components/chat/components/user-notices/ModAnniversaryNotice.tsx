import { memo } from 'react';
import { View } from 'react-native';

import { ChatText } from '@app/components/chat/components/chat-text/ChatText';
import { reportUnrenderableNotice } from '@app/utils/chat/chat-health/reportUnrenderableNotice';
import type { MessageToken } from '@app/utils/chat/messageToken';

import { styles } from '../chat-message/ChatRow.styles';
import { getChatTextStyles } from '../chat-message/ChatText.styles';
import { ChatNoticeMetaRow } from '../chat-message/renderers/ChatNoticeMetaRow';
import type { ChatFontScale } from '../chat-message/util/chatScale';
import { CHAT_NOTICE_ACCENTS } from '../util/chatNoticeAccents';
import { NoticeUserMessage } from './NoticeUserMessage';
import { splitNoticeSubject } from './util/noticeSentence';

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
        icon='shield.fill'
        label='Mod anniversary'
        {...{
          compact,
          fontScale,
          labelColor: CHAT_NOTICE_ACCENTS.modAnniversary,
          labelStyle: styles.modAnniversaryMetaText,
        }}
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
        {...{
          compact,
          disableAnimations,
          fontScale,
          message: content,
          parsedMessage,
        }}
      />
    </View>
  );
}

export const ModAnniversaryNotice = memo(ModAnniversaryNoticeComponent);
