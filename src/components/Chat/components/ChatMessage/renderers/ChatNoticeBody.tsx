import { View } from 'react-native';

import { CHAT_NOTICE_ACCENTS } from '@app/components/Chat/components/util/chatNoticeAccents';
import { Text } from '@app/components/ui/Text/Text';
import { reportUnrenderableNotice } from '@app/utils/chat/chatHealth/reportUnrenderableNotice';
import type { ChatBodyVariant } from '@app/utils/chat/deriveChatBody/types';

import { getChatTextStyles } from '../chatText.styles';
import { styles } from '../RichChatMessage.styles';
import { ChatMessageBody } from './ChatMessageBody';
import { ChatNoticeMetaRow } from './ChatNoticeMetaRow';
import type { ChatMessagePartRendererArgs } from './types/ChatMessagePartRendererArgs';

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

interface ChatNoticeBodyProps extends ChatMessagePartRendererArgs {
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
      reason: `no-parts:${bodyVariant}`,
      stage: 'render',
    });
  }

  const body = (
    <ChatMessageBody
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
        <Text
          tabular
          style={
            getChatTextStyles(rendererArgs.fontScale, rendererArgs.compact)
              .timestamp
          }
        >
          {timestamp}
        </Text>
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
