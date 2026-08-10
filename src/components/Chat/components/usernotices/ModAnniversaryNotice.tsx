import { memo } from 'react';
import { View } from 'react-native';

import { Text } from '@app/components/ui/Text/Text';
import i18next from '@app/i18n/i18next';
import { reportUnrenderableNotice } from '@app/utils/chat/chatHealth/reportUnrenderableNotice';
import { ParsedPart } from '@app/utils/chat/parsedPart';

import type { ChatFontScale } from '../ChatMessage/chatScale';
import { getChatTextStyles } from '../ChatMessage/chatText.styles';
import { ChatNoticeMetaRow } from '../ChatMessage/renderers/ChatNoticeMetaRow';
import { styles } from '../ChatMessage/RichChatMessage.styles';
import { CHAT_NOTICE_ACCENTS } from '../util/chatNoticeAccents';
import { NoticeUserMessage } from './NoticeUserMessage';
import { splitNoticeSubject } from './util/noticeSentence';

interface ModAnniversaryNoticeProps {
  compact?: boolean;
  disableAnimations?: boolean;
  fontScale?: ChatFontScale;
  parsedMessage?: ParsedPart[];
  part: ParsedPart<'modiversary'>;
}

function ModAnniversaryNoticeComponent({
  compact,
  disableAnimations,
  fontScale,
  parsedMessage,
  part,
}: ModAnniversaryNoticeProps) {
  const textStyles = getChatTextStyles(fontScale, compact);
  const displayName = part.displayName?.trim() || '';
  const systemMsg = part.systemMsg?.trim() || '';
  const content = part.content?.trim() || '';

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
        label={i18next.t('chat:notices.modAnniversary')}
        labelColor={CHAT_NOTICE_ACCENTS.modAnniversary}
        labelStyle={styles.modAnniversaryMetaText}
      />
      {systemMsg ? (
        <Text style={textStyles.meta}>
          {lead ? (
            <Text style={[textStyles.meta, styles.channelPointsMetaName]}>
              {lead}
            </Text>
          ) : null}
          {rest ? (
            <Text style={[textStyles.meta, styles.channelPointsMetaMuted]}>
              {lead ? ` ${rest}` : rest}
            </Text>
          ) : null}
        </Text>
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
