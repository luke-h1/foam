import { Text } from '@app/components/ui/Text/Text';
import type { ParsedPart } from '@app/utils/chat/replaceTextWithEmotes';
import { SymbolView } from 'expo-symbols';
import type { ReactNode } from 'react';
import { View } from 'react-native';
import { ChatMessagePressable } from '../ChatMessagePressable';
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
  const replyPreviewText = parentDisplayName
    ? `Replying to @${parentDisplayName}${replyBody ? `: ${replyBody}` : ''}`
    : undefined;

  return (
    <View style={styles.messageColumn}>
      {shouldRenderInlineReply && replyPreviewText ? (
        canJumpToReplyTarget && replyParentMessageId ? (
          <ChatMessagePressable
            hitSlop={undefined}
            onPress={() => onReplyContextPress?.(replyParentMessageId)}
            style={[styles.replyContextRow, styles.replyContextRowInteractive]}
            testID='chat-reply-context-button'
          >
            <SymbolView
              name='bubble.left.fill'
              size={12}
              tintColor='rgba(255,255,255,0.5)'
              style={styles.replyContextIcon}
            />
            <Text
              ellipsizeMode='tail'
              numberOfLines={1}
              style={[
                styles.replyContextText,
                compact && styles.replyContextTextCompact,
              ]}
            >
              {replyPreviewText}
            </Text>
          </ChatMessagePressable>
        ) : (
          <View style={styles.replyContextRow}>
            <SymbolView
              name='bubble.left.fill'
              size={12}
              tintColor='rgba(255,255,255,0.5)'
              style={styles.replyContextIcon}
            />
            <Text
              ellipsizeMode='tail'
              numberOfLines={1}
              style={[
                styles.replyContextText,
                compact && styles.replyContextTextCompact,
              ]}
            >
              {replyPreviewText}
            </Text>
          </View>
        )
      ) : isFirstMessage ? (
        <View style={styles.messageMetaRow}>
          <SymbolView
            name='sparkles'
            size={12}
            tintColor='rgba(255,255,255,0.5)'
            style={styles.replyContextIcon}
          />
          <Text
            style={[
              styles.messageMetaText,
              styles.messageMetaTextStrong,
              compact && styles.messageMetaTextCompact,
            ]}
          >
            First message
          </Text>
        </View>
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
          <Text
            tabular
            variant='mono'
            weight='bold'
            style={[styles.timestamp, compact && styles.timestampCompact]}
          >
            {timestamp}
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
        {renderParts(message, renderMessagePart)}
      </View>
    </View>
  );
}
