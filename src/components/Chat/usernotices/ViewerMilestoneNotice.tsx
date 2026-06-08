import { memo } from 'react';
import { Text } from '@app/components/ui/Text/Text';
import { ParsedPart } from '@app/utils/chat/replaceTextWithEmotes';
import { View } from 'react-native';

import { CHAT_NOTICE_ACCENTS } from '../util/chatNoticeAccents';
import { ChatNoticeMetaRow } from '../ChatMessage/renderers/ChatNoticeMetaRow';
import { styles } from '../ChatMessage/RichChatMessage.styles';
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
      return 'Watch streak';
    case 'follow':
      return 'Follow milestone';
    default:
      return 'Milestone';
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
