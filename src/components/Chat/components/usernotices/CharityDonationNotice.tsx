import { memo } from 'react';
import { View } from 'react-native';

import { Text } from '@app/components/ui/Text/Text';
import i18next from '@app/i18n/i18next';
import type { ParsedPart } from '@app/utils/chat/parsedPart';

import type { ChatFontScale } from '../ChatMessage/chatScale';
import { getChatTextStyles } from '../ChatMessage/chatText.styles';
import { ChatNoticeMetaRow } from '../ChatMessage/renderers/ChatNoticeMetaRow';
import { styles } from '../ChatMessage/RichChatMessage.styles';
import { CHAT_NOTICE_ACCENTS } from '../util/chatNoticeAccents';

interface CharityDonationNoticeProps {
  compact?: boolean;
  fontScale?: ChatFontScale;
  part: ParsedPart<'charitydonation'>;
}

function CharityDonationNoticeComponent({
  compact,
  fontScale,
  part,
}: CharityDonationNoticeProps) {
  const displayName = part.displayName?.trim();
  const systemMsg = part.systemMsg;
  const message = part.message?.trim();
  const donationSummary = `donated ${part.amount} to ${part.charityName}`;
  const textStyles = getChatTextStyles(fontScale, compact);
  const mutedStyle = [textStyles.meta, styles.channelPointsMetaMuted];

  return (
    <View style={styles.messageColumn}>
      <ChatNoticeMetaRow
        compact={compact}
        fontScale={fontScale}
        icon='heart.fill'
        label={i18next.t('chat:notices.charityDonation')}
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
      {message ? <Text style={mutedStyle}>{message}</Text> : null}
    </View>
  );
}

export const CharityDonationNotice = memo(CharityDonationNoticeComponent);
