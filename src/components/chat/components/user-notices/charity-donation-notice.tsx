import { memo } from 'react';
import { View } from 'react-native';

import { Text } from '@app/components/ui/text/text';
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
      <Text style={textStyles.meta}>
        {displayName ? (
          <Text style={[textStyles.meta, styles.channelPointsMetaName]}>
            {displayName}
          </Text>
        ) : null}
        {displayName ? <Text style={mutedStyle}> · </Text> : null}
        <Text style={mutedStyle}>{donationSummary}</Text>
        {systemMsg && !message ? (
          <Text style={mutedStyle}>. {systemMsg}</Text>
        ) : (
          <Text style={mutedStyle}>.</Text>
        )}
      </Text>
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
