import { Text } from '@app/components/ui/Text/Text';
import type { ParsedPart } from '@app/utils/chat/replaceTextWithEmotes';
import { memo, type ReactNode } from 'react';
import { View } from 'react-native';
import { styles } from '../RichChatMessage.styles';
import type { ChatBodyVariant } from '../richChatMessageUtils';
import { renderParts } from '../richChatMessageUtils';

interface SpecialChatBodyProps {
  bodyVariant: Exclude<ChatBodyVariant, 'user_chat'>;
  compact: boolean;
  message: ParsedPart[];
  renderMessagePart: (part: ParsedPart, index: number) => ReactNode;
  renderSystemMessagePart: (part: ParsedPart, index: number) => ReactNode;
  showTimestamp: boolean;
  timestamp?: string;
}

export const SpecialChatBody = memo(
  ({
    bodyVariant,
    compact,
    message,
    renderMessagePart,
    renderSystemMessagePart,
    showTimestamp,
    timestamp,
  }: SpecialChatBodyProps) => {
    switch (bodyVariant) {
      case 'twitch_system_notice':
        return (
          <View style={styles.systemMessageRow}>
            {showTimestamp && timestamp ? (
              <Text
                tabular
                variant='mono'
                weight='bold'
                style={[styles.timestamp, compact && styles.timestampCompact]}
              >
                {timestamp}
              </Text>
            ) : null}
            {renderParts(message, renderSystemMessagePart)}
          </View>
        );

      case 'subscription':
        return (
          <View style={styles.subscriptionNoticeContainer}>
            {renderParts(message, renderMessagePart)}
          </View>
        );

      case 'stv_emote_event':
        return (
          <View
            style={[styles.systemMessageRow, styles.stvSystemRowAlignStart]}
          >
            {showTimestamp && timestamp ? (
              <Text
                tabular
                variant='mono'
                weight='bold'
                style={[styles.timestamp, compact && styles.timestampCompact]}
              >
                {timestamp}
              </Text>
            ) : null}
            {renderParts(message, renderMessagePart)}
          </View>
        );

      case 'viewer_milestone':
        return (
          <View style={styles.viewerMilestoneRow}>
            {showTimestamp && timestamp ? (
              <Text
                tabular
                variant='mono'
                weight='bold'
                style={[styles.timestamp, compact && styles.timestampCompact]}
              >
                {timestamp}
              </Text>
            ) : null}
            {renderParts(message, renderMessagePart)}
          </View>
        );

      case 'app_system_sender':
        return (
          <View style={styles.systemMessageRow}>
            {showTimestamp && timestamp ? (
              <Text
                tabular
                variant='mono'
                weight='bold'
                style={[styles.timestamp, compact && styles.timestampCompact]}
              >
                {timestamp}
              </Text>
            ) : null}
            {renderParts(message, renderSystemMessagePart)}
          </View>
        );

      default:
        return null;
    }
  },
);

SpecialChatBody.displayName = 'SpecialChatBody';
