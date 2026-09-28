import { memo } from 'react';
import { View } from 'react-native';

import { Text } from '@app/components/ui/text/text';
import { reportUnrenderableNotice } from '@app/utils/chat/chat-health/report-unrenderable-notice';
import { ParsedPart } from '@app/utils/chat/parsed-part';

import { getChatTextStyles } from '../chat-message/chat-text.styles';
import { ChatNoticeMetaRow } from '../chat-message/renderers/chat-notice-meta-row';
import { styles } from '../chat-message/rich-chat-message.styles';
import type { ChatFontScale } from '../chat-message/util/chat-scale';
import { CHAT_NOTICE_ACCENTS } from '../util/chat-notice-accents';
import { NoticeUserMessage } from './notice-user-message';
import { splitNoticeSubject } from './util/notice-sentence';

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
        label='Mod anniversary'
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
