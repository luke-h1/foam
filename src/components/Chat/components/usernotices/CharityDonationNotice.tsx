import { memo } from 'react';
import { Text } from '@app/components/ui/Text/Text';
import type { ParsedPart } from '@app/utils/chat/replaceTextWithEmotes';
import { unescapeIrcTag } from '@app/utils/chat/unescapeIrcTag';
import { View } from 'react-native';

import { CHAT_NOTICE_ACCENTS } from '../util/chatNoticeAccents';
import { ChatNoticeMetaRow } from '../ChatMessage/renderers/ChatNoticeMetaRow';
import { styles } from '../ChatMessage/RichChatMessage.styles';

interface CharityDonationNoticeProps {
  part: ParsedPart<'charitydonation'>;
}

function CharityDonationNoticeComponent({ part }: CharityDonationNoticeProps) {
  const displayName = part.displayName?.trim();
  const systemMsg = unescapeIrcTag(part.systemMsg);
  const message = part.message?.trim();
  const donationSummary = `donated ${part.amount} to ${part.charityName}`;

  return (
    <View style={styles.messageColumn}>
      <ChatNoticeMetaRow
        icon='heart.fill'
        label='Charity donation'
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
