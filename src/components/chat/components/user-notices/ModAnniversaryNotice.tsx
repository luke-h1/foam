import { memo } from 'react';
import { View } from 'react-native';

import { CHAT_NOTICE_ACCENTS } from '@app/components/chat/util/chatNoticeAccents';
import type { ChatDensity, ChatFontScale } from '@app/store/preference-store';
import type { MessageToken } from '@app/types/chat/messageToken';
import { reportUnrenderableNotice } from '@app/utils/chat/chat-health/reportUnrenderableNotice';

import { styles } from '../chat-message/ChatRow.styles';
import { getChatTextStyles } from '../chat-message/ChatText.styles';
import { ChatNoticeMetaRow } from '../chat-message/renderers/ChatNoticeMetaRow';
import { MilestoneSystemMessage } from './MilestoneSystemMessage';
import { NoticeUserMessage } from './NoticeUserMessage';
import { splitNoticeSubject } from './util/noticeSentence';

interface ModAnniversaryNoticeProps {
  density?: ChatDensity;
  disableEmoteAnimations?: boolean;
  fontScale?: ChatFontScale;
  messageTokens: MessageToken[];
  token: MessageToken<'modiversary'>;
}

function ModAnniversaryNoticeComponent({
  density,
  disableEmoteAnimations,
  fontScale,
  messageTokens,
  token,
}: ModAnniversaryNoticeProps) {
  const textStyles = getChatTextStyles(fontScale, density);
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
          density,
          fontScale,
          labelColor: CHAT_NOTICE_ACCENTS.modAnniversary,
          labelStyle: styles.modAnniversaryMetaText,
        }}
      />
      {systemMsg ? (
        <MilestoneSystemMessage
          lead={lead}
          rest={rest}
          style={textStyles.meta}
        />
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

export const ModAnniversaryNotice = memo(ModAnniversaryNoticeComponent);
