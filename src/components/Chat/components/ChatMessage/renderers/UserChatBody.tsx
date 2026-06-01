import { Text } from '@app/components/ui/Text/Text';
import type { ParsedPart } from '@app/utils/chat/replaceTextWithEmotes';
import type { ReactNode } from 'react';
import { View } from 'react-native';
import { Button } from '../../../../Button/Button';
import { styles } from '../RichChatMessage.styles';
import { renderParts } from '../richChatMessageUtils';

interface UserChatBodyProps {
  canJumpToReplyTarget: boolean;
  compact: boolean;
  isFirstMessage: boolean;
  message: ParsedPart[];
  moderationNotice?: unknown;
  onReplyContextPress?: (replyParentMessageId: string) => void;
  parentDisplayName?: string;
  renderBadges: () => ReactNode;
  renderMessagePart: (part: ParsedPart, index: number) => ReactNode;
  replyBody?: string;
  replyParentMessageId?: string;
  rewardSummaryTitle: string;
  shouldRenderInlineReply: boolean;
  showChannelPointsRewardChrome: boolean;
  showTimestamp: boolean;
  timestamp?: string;
  username?: string;
  usernameElement: ReactNode;
}

export function UserChatBody({
  canJumpToReplyTarget,
  compact,
  isFirstMessage,
  message,
  moderationNotice,
  onReplyContextPress,
  parentDisplayName,
  renderBadges,
  renderMessagePart,
  replyBody,
  replyParentMessageId,
  rewardSummaryTitle,
  shouldRenderInlineReply,
  showChannelPointsRewardChrome,
  showTimestamp,
  timestamp,
  username,
  usernameElement,
}: UserChatBodyProps): ReactNode {
  return (
    <View style={styles.messageColumn}>
      {shouldRenderInlineReply ? (
        <Button
          disabled={!canJumpToReplyTarget}
          hitSlop={undefined}
          onPress={
            canJumpToReplyTarget && replyParentMessageId
              ? () => onReplyContextPress?.(replyParentMessageId)
              : undefined
          }
          style={[
            styles.replyContextRow,
            canJumpToReplyTarget && styles.replyContextRowInteractive,
          ]}
          testID='chat-reply-context-button'
        >
          <Text
            style={[
              styles.replyContextLabel,
              compact && styles.replyContextLabelCompact,
            ]}
          >
            Replying to {parentDisplayName}
          </Text>
          {replyBody ? (
            <Text
              numberOfLines={1}
              style={[
                styles.replyContextBody,
                compact && styles.replyContextBodyCompact,
              ]}
            >
              {replyBody}
            </Text>
          ) : null}
        </Button>
      ) : null}
      {showChannelPointsRewardChrome ? (
        <View style={styles.rewardSummaryRow}>
          <Text style={styles.rewardSummaryText}>
            <Text style={styles.rewardSummaryName}>{username}</Text>
            <Text style={styles.rewardSummaryMuted}> redeemed </Text>
            <Text style={styles.rewardSummaryRewardTitle}>
              {rewardSummaryTitle}
            </Text>
          </Text>
        </View>
      ) : null}
      <View style={styles.messageLine}>
        {showTimestamp && timestamp ? (
          <Text style={[styles.timestamp, compact && styles.timestampCompact]}>
            {timestamp}:
          </Text>
        ) : null}
        {renderBadges()}
        {usernameElement ? (
          <View
            style={moderationNotice ? styles.moderatedUsernameContainer : null}
          >
            {usernameElement}
          </View>
        ) : null}
        {isFirstMessage ? (
          <Text
            style={[
              styles.inlineIndicatorText,
              compact && styles.inlineIndicatorTextCompact,
            ]}
          >
            first-msg
          </Text>
        ) : null}
        {renderParts(message, renderMessagePart)}
      </View>
    </View>
  );
}
