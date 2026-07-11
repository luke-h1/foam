import { memo } from 'react';
import { View } from 'react-native';

import { Text } from '@app/components/ui/Text/Text';
import i18next from '@app/i18n/i18next';
import type { ParsedPart } from '@app/utils/chat/parsedPart';

import { ChatNoticeMetaRow } from '../ChatMessage/renderers/ChatNoticeMetaRow';
import { styles } from '../ChatMessage/RichChatMessage.styles';
import { CHAT_NOTICE_ACCENTS } from '../util/chatNoticeAccents';

interface CharityDonationNoticeProps {
  part: ParsedPart<'charitydonation'>;
}

function CharityDonationNoticeComponent({ part }: CharityDonationNoticeProps) {
  const displayName = part.displayName?.trim();
  const systemMsg = part.systemMsg;
  const message = part.message?.trim();
  const donationSummary = `donated ${part.amount} to ${part.charityName}`;

  return (
    <View style={styles.messageColumn}>
      <ChatNoticeMetaRow
        icon='heart.fill'
        label={i18next.t('chat:notices.charityDonation')}
        labelColor={CHAT_NOTICE_ACCENTS.charity}
      />
      <Text style={styles.messageMetaText}>
        {displayName ? (
          <Text style={styles.channelPointsMetaName}>{displayName}</Text>
        ) : null}
        {displayName ? (
          <Text style={styles.channelPointsMetaMuted}> · </Text>
        ) : null}
        <Text style={styles.channelPointsMetaMuted}>{donationSummary}</Text>
        {systemMsg && !message ? (
          <Text style={styles.channelPointsMetaMuted}>. {systemMsg}</Text>
        ) : (
          <Text style={styles.channelPointsMetaMuted}>.</Text>
        )}
      </Text>
      {message ? (
        <Text style={[styles.messageMetaText, styles.channelPointsMetaMuted]}>
          {message}
        </Text>
      ) : null}
    </View>
  );
}

export const CharityDonationNotice = memo(CharityDonationNoticeComponent);
