import { Text } from '@app/components/ui/Text/Text';
import { View } from 'react-native';
import { CHAT_NOTICE_ACCENTS } from '../../util/chatNoticeAccents';
import { styles } from '../RichChatMessage.styles';
import type { ChatBodyVariant } from '../richChatMessageHelpers';
import { ChatNoticeMetaRow } from './ChatNoticeMetaRow';
import { ChatMessageBody } from './ChatMessageBody';
import type { UseChatMessagePartRendererArgs } from './useChatMessagePartRenderer';
import i18next from '@app/i18n/i18next';

interface ChatNoticeBodyProps extends UseChatMessagePartRendererArgs {
  bodyVariant: Exclude<ChatBodyVariant, 'user_chat'>;
  compact: boolean;
  showTimestamp: boolean;
  timestamp?: string;
}

function SpecialChatTimestamp({
  compact,
  timestamp,
}: {
  compact: boolean;
  timestamp: string;
}) {
  return (
    <Text
      tabular
      variant='mono'
      weight='bold'
      style={[styles.timestamp, compact && styles.timestampCompact]}
    >
      {timestamp}
    </Text>
  );
}

export function ChatNoticeBody({
  bodyVariant,
  compact,
  message,
  showTimestamp,
  timestamp,
  ...rendererArgs
}: ChatNoticeBodyProps) {
  const timestampNode =
    showTimestamp && timestamp ? (
      <SpecialChatTimestamp compact={compact} timestamp={timestamp} />
    ) : null;

  switch (bodyVariant) {
    case 'raid': {
      const noticeMsgId = rendererArgs.noticeTags?.['msg-id'];
      const isUnraid = noticeMsgId === 'unraid';

      return (
        <View style={styles.messageColumn}>
          <ChatNoticeMetaRow
            compact={compact}
            icon={isUnraid ? 'xmark.circle.fill' : 'person.3.fill'}
            label={
              isUnraid
                ? i18next.t('chat:notices.raidCancelled')
                : i18next.t('chat:notices.raid')
            }
            labelColor={CHAT_NOTICE_ACCENTS.raid}
            labelStyle={styles.raidNoticeMetaText}
          />
          <View style={styles.systemMessageRow}>
            {timestampNode}
            <ChatMessageBody
              compact={compact}
              mode='system'
              message={message}
              {...rendererArgs}
            />
          </View>
        </View>
      );
    }

    case 'twitch_system_notice':
      return (
        <View style={styles.systemMessageRow}>
          {timestampNode}
          <ChatMessageBody
            compact={compact}
            mode='system'
            message={message}
            {...rendererArgs}
          />
        </View>
      );

    case 'subscription':
      return (
        <ChatMessageBody
          compact={compact}
          mode='message'
          message={message}
          {...rendererArgs}
        />
      );

    case 'stv_emote_event':
      return (
        <View style={[styles.systemMessageRow, styles.stvSystemRowAlignStart]}>
          {timestampNode}
          <ChatMessageBody
            compact={compact}
            mode='message'
            message={message}
            {...rendererArgs}
          />
        </View>
      );

    case 'viewer_milestone':
      return (
        <View style={styles.viewerMilestoneRow}>
          {timestampNode}
          <ChatMessageBody
            compact={compact}
            mode='message'
            message={message}
            {...rendererArgs}
          />
        </View>
      );

    case 'charity_donation':
      return (
        <View style={styles.charityDonationRow}>
          {timestampNode}
          <ChatMessageBody
            compact={compact}
            mode='message'
            message={message}
            {...rendererArgs}
          />
        </View>
      );

    case 'ritual':
      return (
        <View style={styles.viewerMilestoneRow}>
          {timestampNode}
          <ChatMessageBody
            compact={compact}
            mode='message'
            message={message}
            {...rendererArgs}
          />
        </View>
      );

    case 'app_system_sender':
      return (
        <View style={styles.systemMessageRow}>
          {timestampNode}
          <ChatMessageBody
            compact={compact}
            mode='system'
            message={message}
            {...rendererArgs}
          />
        </View>
      );

    default:
      return null;
  }
}
