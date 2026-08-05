import { memo } from 'react';
import { View } from 'react-native';

import { Text } from '@app/components/ui/Text/Text';
import i18next from '@app/i18n/i18next';
import { ParsedPart } from '@app/utils/chat/parsedPart';

import type { ChatFontScale } from '../ChatMessage/chatScale';
import { getChatTextStyles } from '../ChatMessage/chatText.styles';
import { ChatNoticeMetaRow } from '../ChatMessage/renderers/ChatNoticeMetaRow';
import { styles } from '../ChatMessage/RichChatMessage.styles';
import { CHAT_NOTICE_ACCENTS } from '../util/chatNoticeAccents';
import {
  resolveViewerMilestoneBody,
  splitViewerMilestoneLead,
} from './util/viewerMilestoneBody';

interface ViewerMilestoneNoticeProps {
  compact?: boolean;
  fontScale?: ChatFontScale;
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

function ViewerMileStoneNotice({
  compact,
  fontScale,
  part,
}: ViewerMilestoneNoticeProps) {
  const textStyles = getChatTextStyles(fontScale, compact);
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
        compact={compact}
        fontScale={fontScale}
        icon='trophy.fill'
        label={getMilestoneMetaLabel(part.category)}
        labelColor={CHAT_NOTICE_ACCENTS.viewerMilestone}
        labelStyle={styles.viewerMilestoneMetaText}
      />
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
    </View>
  );
}

export const ViewerMileStoneNoticeComponent = memo(ViewerMileStoneNotice);
