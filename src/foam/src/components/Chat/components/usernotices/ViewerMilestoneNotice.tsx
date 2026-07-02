import { memo } from 'react';
import { View } from 'react-native';

import { Text } from '@app/components/ui/Text/Text';
import i18next from '@app/i18n/i18next';
import { ParsedPart } from '@app/utils/chat/parsedPart';

import { ChatNoticeMetaRow } from '../ChatMessage/renderers/ChatNoticeMetaRow';
import { styles } from '../ChatMessage/RichChatMessage.styles';
import { CHAT_NOTICE_ACCENTS } from '../util/chatNoticeAccents';
import {
  resolveViewerMilestoneBody,
  splitViewerMilestoneLead,
} from './util/viewerMilestoneBody';

interface ViewerMilestoneNoticeProps {
  part: ParsedPart<'viewermilestone'>;
}

function getMilestoneMetaLabel(category: string): string {
  switch (category) {
    case 'watch-streak':
      return i18next.t('chat:notices.watchStreak');
    case 'follow':
      return i18next.t('chat:notices.followMilestone');
    default:
      return i18next.t('chat:notices.milestone');
  }
}

function ViewerMileStoneNotice({ part }: ViewerMilestoneNoticeProps) {
  const displayName = part.displayName?.trim() || '';
  const messageBody = resolveViewerMilestoneBody({
    content: part.content,
    displayName,
    systemMsg: part.systemMsg,
  });

  if (!messageBody) {
    return null;
  }

  const { lead, rest } = splitViewerMilestoneLead(messageBody, displayName);

  return (
    <View style={styles.messageColumn}>
      <ChatNoticeMetaRow
        icon='trophy.fill'
        label={getMilestoneMetaLabel(part.category)}
        labelColor={CHAT_NOTICE_ACCENTS.viewerMilestone}
        labelStyle={styles.viewerMilestoneMetaText}
      />
      <Text style={styles.messageMetaText}>
        {lead ? <Text style={styles.channelPointsMetaName}>{lead}</Text> : null}
        {rest ? (
          <Text style={styles.channelPointsMetaMuted}>
            {lead ? ` ${rest}` : rest}
          </Text>
        ) : null}
      </Text>
    </View>
  );
}

export const ViewerMileStoneNoticeComponent = memo(ViewerMileStoneNotice);
