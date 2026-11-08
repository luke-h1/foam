import { memo } from 'react';
import { View } from 'react-native';

import { ChatText } from '@app/components/chat/components/chat-text/ChatText';
import { CHAT_NOTICE_ACCENTS } from '@app/components/chat/util/chatNoticeAccents';
import type { ChatDensity, ChatFontScale } from '@app/store/preference-store';
import type { MessageToken } from '@app/types/chat/messageToken';

import { styles } from '../chat-message/ChatRow.styles';
import { getChatTextStyles } from '../chat-message/ChatText.styles';
import { ChatNoticeMetaRow } from '../chat-message/renderers/ChatNoticeMetaRow';
import { NoticeUserMessage } from './NoticeUserMessage';

interface CharityDonationNoticeProps {
  density?: ChatDensity;
  disableEmoteAnimations?: boolean;
  fontScale?: ChatFontScale;
  messageTokens: MessageToken[];
  token: MessageToken<'charitydonation'>;
}

function CharityDonationNoticeComponent({
  density,
  disableEmoteAnimations,
  fontScale,
  messageTokens,
  token,
}: CharityDonationNoticeProps) {
  const displayName = token.displayName?.trim();
  const systemMsg = token.systemMsg;
  const message = token.message?.trim() ?? '';
  const donationSummary = `donated ${token.amount} to ${token.charityName}`;
  const textStyles = getChatTextStyles(fontScale, density);
  const mutedStyle = [textStyles.meta, styles.channelPointsMetaMuted];

  return (
    <View style={styles.messageColumn}>
      <ChatNoticeMetaRow
        icon='heart.fill'
        label='Charity donation'
        {...{ density, fontScale, labelColor: CHAT_NOTICE_ACCENTS.charity }}
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

export const CharityDonationNotice = memo(CharityDonationNoticeComponent);
