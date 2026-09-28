import { memo } from 'react';
import { View } from 'react-native';

import { Text } from '@app/components/ui/text/text';
import { reportUnrenderableNotice } from '@app/utils/chat/chat-health/report-unrenderable-notice';
import { MessageToken } from '@app/utils/chat/message-token';

import { styles } from '../chat-message/chat-row.styles';
import { getChatTextStyles } from '../chat-message/chat-text.styles';
import { ChatNoticeMetaRow } from '../chat-message/renderers/chat-notice-meta-row';
import type { ChatFontScale } from '../chat-message/util/chat-scale';
import { CHAT_NOTICE_ACCENTS } from '../util/chat-notice-accents';
import { MilestoneReward } from './milestone-reward';
import { MilestoneSystemMessage } from './milestone-system-message';
import { NoticeUserMessage } from './notice-user-message';
import { splitNoticeSubject } from './util/notice-sentence';

interface ViewerMilestoneNoticeProps {
  compact?: boolean;
  disableAnimations?: boolean;
  fontScale?: ChatFontScale;
  parsedMessage?: MessageToken[];
  token: MessageToken<'viewermilestone'>;
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

function ViewerMilestoneNoticeComponent({
  compact,
  disableAnimations,
  fontScale,
  parsedMessage,
  token,
}: ViewerMilestoneNoticeProps) {
  const textStyles = getChatTextStyles(fontScale, compact);
  const displayName = token.displayName?.trim() || '';
  const systemMsg = token.systemMsg?.trim() || '';
  const content = token.content?.trim() || '';

  if (!systemMsg && !content) {
    reportUnrenderableNotice({
      msgId: 'viewermilestone',
      reason: 'empty-body',
      stage: 'render',
    });
    return null;
  }

  const { lead, rest } = splitNoticeSubject(systemMsg, displayName);
  const reward = Number.parseInt(token.reward, 10);

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
            {getMilestoneMetaLabel(token.category)}
          </Text>
          <MilestoneReward reward={reward} style={textStyles.meta} />
        </Text>
      </ChatNoticeMetaRow>
      {systemMsg ? (
        <MilestoneSystemMessage
          lead={lead}
          rest={rest}
          style={textStyles.meta}
        />
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

export const ViewerMilestoneNotice = memo(ViewerMilestoneNoticeComponent);
