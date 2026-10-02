import { memo } from 'react';
import { View } from 'react-native';

import { ChatText } from '@app/components/chat/components/chat-text/chat-text';
import type { MessageToken } from '@app/utils/chat/message-token';

import { styles } from '../chat-message/chat-row.styles';
import { getChatTextStyles } from '../chat-message/chat-text.styles';
import { ChatNoticeMetaRow } from '../chat-message/renderers/chat-notice-meta-row';
import type { ChatFontScale } from '../chat-message/util/chat-scale';
import { CHAT_NOTICE_ACCENTS } from '../util/chat-notice-accents';
import { NoticeUserMessage } from './notice-user-message';

interface CharityDonationNoticeProps {
  compact?: boolean;
  disableAnimations?: boolean;
  fontScale?: ChatFontScale;
  parsedMessage?: MessageToken[];
  token: MessageToken<'charitydonation'>;
}

function CharityDonationNoticeComponent({
  compact,
  disableAnimations,
  fontScale,
  parsedMessage,
  token,
}: CharityDonationNoticeProps) {
  const displayName = token.displayName?.trim();
  const systemMsg = token.systemMsg;
  const message = token.message?.trim() ?? '';
  const donationSummary = `donated ${token.amount} to ${token.charityName}`;
  const textStyles = getChatTextStyles(fontScale, compact);
  const mutedStyle = [textStyles.meta, styles.channelPointsMetaMuted];

  return (
    <View style={styles.messageColumn}>
      <ChatNoticeMetaRow
        compact={compact}
        fontScale={fontScale}
        icon='heart.fill'
        label='Charity donation'
        labelColor={CHAT_NOTICE_ACCENTS.charity}
      />
      <ChatText style={textStyles.meta}>
        {displayName ? (
          <ChatText style={[textStyles.meta, styles.channelPointsMetaName]}>
            {displayName}
          </ChatText>
        ) : null}
        {displayName ? <ChatText style={mutedStyle}> · </ChatText> : null}
        <ChatText style={mutedStyle}>{donationSummary}</ChatText>
        {systemMsg && !message ? (
          <ChatText style={mutedStyle}>. {systemMsg}</ChatText>
        ) : (
          <ChatText style={mutedStyle}>.</ChatText>
        )}
      </ChatText>
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

export const CharityDonationNotice = memo(CharityDonationNoticeComponent);
