import { memo } from 'react';
import { View } from 'react-native';

import { Text } from '@app/components/ui/Text/Text';
import { reportUnrenderableNotice } from '@app/utils/chat/chatHealth/reportUnrenderableNotice';
import { ParsedPart } from '@app/utils/chat/parsedPart';

import type { ChatFontScale } from '../ChatMessage/chatScale';
import { getChatTextStyles } from '../ChatMessage/chatText.styles';
import { ChatNoticeMetaRow } from '../ChatMessage/renderers/ChatNoticeMetaRow';
import { styles } from '../ChatMessage/RichChatMessage.styles';
import { CHAT_NOTICE_ACCENTS } from '../util/chatNoticeAccents';
import { NoticeUserMessage } from './NoticeUserMessage';
import { splitNoticeSubject } from './util/noticeSentence';

interface ViewerMilestoneNoticeProps {
  compact?: boolean;
  disableAnimations?: boolean;
  fontScale?: ChatFontScale;
  parsedMessage?: ParsedPart[];
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

function ViewerMileStoneNotice({
  compact,
  disableAnimations,
  fontScale,
  parsedMessage,
  part,
}: ViewerMilestoneNoticeProps) {
  const textStyles = getChatTextStyles(fontScale, compact);
  const displayName = part.displayName?.trim() || '';
  const systemMsg = part.systemMsg?.trim() || '';
  const content = part.content?.trim() || '';

  if (!systemMsg && !content) {
    reportUnrenderableNotice({
      msgId: 'viewermilestone',
      reason: 'empty-body',
      stage: 'render',
    });
    return null;
  }

  const { lead, rest } = splitNoticeSubject(systemMsg, displayName);
  const reward = Number.parseInt(part.reward, 10);

  return (
    <View style={styles.messageColumn}>
      <ChatNoticeMetaRow
        compact={compact}
        fontScale={fontScale}
        icon='flame.fill'
        labelColor={CHAT_NOTICE_ACCENTS.viewerMilestone}
      >
        <Text style={[textStyles.meta, styles.messageMetaTextFlex]}>
          <Text
            style={[
              textStyles.meta,
              textStyles.metaStrong,
              styles.viewerMilestoneMetaText,
            ]}
          >
            {getMilestoneMetaLabel(part.category)}
          </Text>
          {Number.isFinite(reward) && reward > 0 ? (
            <Text style={[textStyles.meta, styles.channelPointsMetaReward]}>
              {`+${reward} ${reward === 1 ? 'point' : 'points'}`}
            </Text>
          ) : null}
        </Text>
      </ChatNoticeMetaRow>
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

export const ViewerMileStoneNoticeComponent = memo(ViewerMileStoneNotice);
