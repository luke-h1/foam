import { memo } from 'react';
import { View } from 'react-native';

import { ChatText } from '@app/components/chat/components/chat-text/ChatText';
import { CHAT_NOTICE_ACCENTS } from '@app/components/chat/util/chatNoticeAccents';
import type { ChatDensity, ChatFontScale } from '@app/store/preference-store';
import type { MessageToken } from '@app/types/chat/messageToken';
import { reportUnrenderableNotice } from '@app/utils/chat/chat-health/reportUnrenderableNotice';

import { styles } from '../chat-message/ChatRow.styles';
import { getChatTextStyles } from '../chat-message/ChatText.styles';
import { ChatNoticeMetaRow } from '../chat-message/renderers/ChatNoticeMetaRow';
import { MilestoneReward } from './MilestoneReward';
import { MilestoneSystemMessage } from './MilestoneSystemMessage';
import { NoticeUserMessage } from './NoticeUserMessage';
import { splitNoticeSubject } from './util/noticeSentence';

interface ViewerMilestoneNoticeProps {
  density?: ChatDensity;
  disableEmoteAnimations?: boolean;
  fontScale?: ChatFontScale;
  messageTokens: MessageToken[];
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
  density,
  disableEmoteAnimations,
  fontScale,
  messageTokens,
  token,
}: ViewerMilestoneNoticeProps) {
  const textStyles = getChatTextStyles(fontScale, density);
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
        icon='flame.fill'
        {...{
          density,
          fontScale,
          labelColor: CHAT_NOTICE_ACCENTS.viewerMilestone,
        }}
      >
        <ChatText style={[textStyles.meta, styles.messageMetaTextFlex]}>
          <ChatText
            style={[
              textStyles.meta,
              textStyles.metaStrong,
              styles.viewerMilestoneMetaText,
            ]}
          >
            {getMilestoneMetaLabel(token.category)}
          </ChatText>
          <MilestoneReward reward={reward} style={textStyles.meta} />
        </ChatText>
      </ChatNoticeMetaRow>
      {systemMsg ? (
        <MilestoneSystemMessage
          lead={lead}
          rest={rest}
          style={textStyles.meta}
        />
      ) : null}
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

export const ViewerMilestoneNotice = memo(ViewerMilestoneNoticeComponent);
