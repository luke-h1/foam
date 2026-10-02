import { View } from 'react-native';

import { ChatText } from '@app/components/chat/components/chat-text/chat-text';
import { CHAT_NOTICE_ACCENTS } from '@app/components/chat/components/util/chat-notice-accents';
import { reportUnrenderableNotice } from '@app/utils/chat/chat-health/report-unrenderable-notice';
import type { ChatBodyVariant } from '@app/utils/chat/derive-chat-body/types';

import { styles } from '../chat-row.styles';
import { getChatTextStyles } from '../chat-text.styles';
import { ChatNoticeMetaRow } from './chat-notice-meta-row';
import type { ChatTokenRenderProps } from './types/chat-token-render-props';
import { WrappedTokens } from './wrapped-tokens';

/**
 * `announcement` and `user_chat` are dispatched by `ChatRow.Body` before
 * this component, so every variant reaching here has a row in the table below.
 */
type ChatNoticeVariant = Exclude<ChatBodyVariant, 'announcement' | 'user_chat'>;

const NOTICE_BODY_MODES = {
  app_system_sender: 'system',
  charity_donation: 'message',
  mod_anniversary: 'message',
  raid: 'system',
  ritual: 'message',
  stv_emote_event: 'message',
  subscription: 'message',
  twitch_system_notice: 'system',
  viewer_milestone: 'message',
} satisfies Record<ChatNoticeVariant, 'message' | 'system'>;

interface ChatNoticeBodyProps extends ChatTokenRenderProps {
  bodyVariant: ChatNoticeVariant;
  showTimestamp: boolean;
  timestamp?: string;
}

export function ChatNoticeBody({
  bodyVariant,
  message,
  showTimestamp,
  timestamp,
  ...rendererArgs
}: ChatNoticeBodyProps) {
  if (message.length === 0) {
    reportUnrenderableNotice({
      msgId: rendererArgs.noticeTags?.['msg-id'],
      reason: `no-tokens:${bodyVariant}`,
      stage: 'render',
    });
  }

  const body = (
    <WrappedTokens
      mode={NOTICE_BODY_MODES[bodyVariant]}
      message={message}
      {...rendererArgs}
    />
  );

  /**
   * A subscription body is a SubscriptionNotice, which draws its own column
   * and carries no timestamp.
   */
  if (bodyVariant === 'subscription') {
    return body;
  }

  const row = (
    <View style={styles.noticeRow}>
      {showTimestamp && timestamp ? (
        <ChatText
          tabular
          style={
            getChatTextStyles(rendererArgs.fontScale, rendererArgs.compact)
              .timestamp
          }
        >
          {timestamp}
        </ChatText>
      ) : null}
      {body}
    </View>
  );

  if (bodyVariant !== 'raid') {
    return row;
  }

  const isUnraid = rendererArgs.noticeTags?.['msg-id'] === 'unraid';

  return (
    <View style={styles.messageColumn}>
      <ChatNoticeMetaRow
        compact={rendererArgs.compact}
        fontScale={rendererArgs.fontScale}
        icon={isUnraid ? 'xmark.circle.fill' : 'person.3.fill'}
        label={isUnraid ? 'Raid cancelled' : 'Raid'}
        labelColor={CHAT_NOTICE_ACCENTS.raid}
        labelStyle={styles.raidNoticeMetaText}
      />
      {row}
    </View>
  );
}
