/* eslint-disable camelcase */
import { SanitisedBadgeSet } from '@app/services/twitch-badge-service';
import { ChatMessageType } from '@app/store/chatStore';
import { NoticeVariants } from '@app/types/chat/irc-tags/noticevariant';
import {
  UserNoticeVariantMap,
  UserNoticeTags,
} from '@app/types/chat/irc-tags/usernotice';
import { generateRandomTwitchColor } from '@app/utils/chat/generateRandomTwitchColor';
import { ParsedPart } from '@app/utils/chat/replaceTextWithEmotes';
import { unescapeIrcTag } from '@app/utils/chat/unescapeIrcTag';
import { lightenColor } from '@app/utils/color/lightenColor';
import { formatDate } from '@app/utils/date-time/date';
import { truncate } from '@app/utils/string/truncate';
import React, { useCallback, memo } from 'react';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Button } from '../../../Button';
import { Icon } from '../../../Icon';
import { Image } from '../../../Image';
import { Text } from '../../../Text';
import { MediaLinkCard } from '../MediaLinkCard';
import { StvEmoteEvent } from '../StvEmoteEvent';
import { SubscriptionNotice } from '../usernotices/SubscriptionNotice';
import { ViewerMileStoneNotice } from '../usernotices/ViewerMilestoneNotice';
import { EmoteRenderer } from './renderers';

type OnReply<TNoticeType extends NoticeVariants> = Omit<
  ChatMessageType<TNoticeType>,
  'style'
>;

export type EmotePressData = ParsedPart<'emote'>;
export type BadgePressData = SanitisedBadgeSet;
export type MessageActionData<TNoticeType extends NoticeVariants> = {
  message: ParsedPart[];
  username?: string;
  messageData: OnReply<TNoticeType>;
};

function ChatMessageComponent<
  TNoticeType extends NoticeVariants,
  TVariant extends TNoticeType extends 'usernotice'
    ? keyof UserNoticeVariantMap
    : never = never,
>({
  id,
  userstate,
  message,
  badges,
  channel,
  message_id,
  message_nonce,
  sender,
  style,
  parentDisplayName,
  replyBody,
  replyDisplayName,
  parentColor,
  notice_tags,
  onReply,
  onEmotePress,
  onBadgePress,
  onMessageLongPress,
  getMentionColor,
}: ChatMessageType<TNoticeType, TVariant> & {
  onReply: (args: OnReply<TNoticeType>) => void;
  onEmotePress?: (
    data: EmotePressData,
    position: { x: number; y: number; width: number; height: number },
  ) => void;
  onBadgePress?: (data: BadgePressData) => void;
  onMessageLongPress?: (data: MessageActionData<TNoticeType>) => void;
  getMentionColor?: (username: string) => string;
}) {
  const isSubscriptionNotice = message.some(
    part =>
      part.type === 'sub' ||
      part.type === 'resub' ||
      part.type === 'anongiftpaidupgrade' ||
      part.type === 'anongift',
  );

  if (isSubscriptionNotice) {
    console.log('🔔 ChatMessage received subscription:', {
      message_id,
      hasNoticeTags: !!notice_tags,
      noticeTagsType: notice_tags ? typeof notice_tags : 'undefined',
      messageTypes: message.map(m => m.type),
      isSubscriptionNotice,
      noticeTagsKeys: notice_tags ? Object.keys(notice_tags) : [],
    });
  }

  const handleEmotePress = useCallback(
    (
      part: ParsedPart,
      position: { x: number; y: number; width: number; height: number },
    ) => {
      if (part.type === 'emote') {
        onEmotePress?.(part, position);
      }
    },
    [onEmotePress],
  );

  const handleBadgePress = useCallback(
    (badge: SanitisedBadgeSet) => {
      onBadgePress?.(badge);
    },
    [onBadgePress],
  );

  const renderMessagePart = useCallback(
    (part: ParsedPart, index: number) => {
      switch (part.type) {
        case 'text': {
          return (
            <Text key={index} color="gray.text" style={styles.messageText}>
              {part.content}
            </Text>
          );
        }

        case 'stvEmote': {
          return <MediaLinkCard type="stvEmote" url={part.content} />;
        }

        case 'twitchClip': {
          return <MediaLinkCard type="twitchClip" url={part.content} />;
        }

        case 'emote': {
          return (
            <EmoteRenderer
              key={index}
              part={part}
              handleEmotePress={handleEmotePress}
            />
          );
        }

        case 'mention': {
          const mentionedUsername = part.content.replace(/^@/, '').trim();

          // Use the cached/memoized color lookup from Chat component
          const mentionColor = getMentionColor
            ? getMentionColor(mentionedUsername)
            : generateRandomTwitchColor(mentionedUsername);

          return (
            <Text key={`message-${index}`}>
              <Text
                style={[
                  styles.mention,
                  styles.mentionDefaultColor,
                  mentionColor && { color: lightenColor(mentionColor) },
                ]}
              >
                {part.content}
              </Text>
            </Text>
          );
        }

        case 'stv_emote_added': {
          return <StvEmoteEvent part={part} />;
        }

        case 'stv_emote_removed': {
          console.log('here for stv remove');
          return <StvEmoteEvent part={part} />;
        }

        case 'sub':
        case 'resub':
        case 'anongiftpaidupgrade':
        case 'anongift': {
          if (notice_tags) {
            return (
              <SubscriptionNotice
                part={part}
                notice_tags={notice_tags as UserNoticeTags}
              />
            );
          }
          return <SubscriptionNotice part={part} />;
        }

        case 'viewermilestone': {
          return <ViewerMileStoneNotice part={part} />;
        }

        default:
          return null;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      userstate.username,
      userstate.color,
      handleEmotePress,
      message_id,
      notice_tags,
    ],
  );

  const renderBadges = useCallback(() => {
    return badges?.map((badge, index) => (
      <Button
        // eslint-disable-next-line react/no-array-index-key
        key={`${badge.set}-${badge.id}-${badge.type}-${badge.url}-${index}`}
        onPress={() => handleBadgePress(badge)}
      >
        <Image source={badge.url} style={styles.badge} transition={20} />
      </Button>
    ));
  }, [badges, handleBadgePress]);

  const handleLongPress = useCallback(() => {
    onMessageLongPress?.({
      message,
      username: userstate.username,
      messageData: {
        id,
        userstate,
        message,
        badges,
        channel,
        message_id,
        message_nonce,
        sender,
        parentDisplayName,
        replyBody,
        replyDisplayName,
      } as OnReply<TNoticeType>,
    });
  }, [
    onMessageLongPress,
    message,
    userstate,
    id,
    badges,
    channel,
    message_id,
    message_nonce,
    sender,
    parentDisplayName,
    replyBody,
    replyDisplayName,
  ]);

  const handleReply = useCallback(() => {
    onReply({
      id,
      userstate,
      message,
      badges,
      channel,
      message_id,
      message_nonce,
      sender,
      parentDisplayName,
      replyBody,
      replyDisplayName,
      parentColor,
      notice_tags,
    } as OnReply<TNoticeType>);
  }, [
    onReply,
    id,
    userstate,
    message,
    badges,
    channel,
    message_id,
    message_nonce,
    sender,
    parentDisplayName,
    replyBody,
    replyDisplayName,
    parentColor,
    notice_tags,
  ]);

  const isReply = Boolean(parentDisplayName);

  const isSystemNotice = message.some(
    part =>
      part.type === 'stv_emote_added' || part.type === 'stv_emote_removed',
  );

  const isFirstMessage = userstate['first-msg'] === '1';

  // Don't allow replies to system messages, subscription notices, or system sender
  const isSystemSender =
    sender === 'System' ||
    sender === 'system' ||
    userstate.username === 'System' ||
    userstate.username === 'system';

  const canReply =
    !isSystemNotice &&
    !isSubscriptionNotice &&
    !isSystemSender &&
    Boolean(userstate.username);

  return (
    <Button
      onLongPress={handleLongPress}
      style={[
        styles.chatContainer,
        style,
        isReply && styles.replyContainer,
        isFirstMessage && styles.firstMessageContainer,
      ]}
    >
      {isReply && (
        <View style={styles.replyIndicatorWrapper} testID="reply-indicator">
          <Icon
            icon="corner-down-right"
            size={10}
            color="rgba(255,255,255,0.5)"
          />
          <Text style={styles.replyLabel}>replying to</Text>
          <Text
            style={[
              styles.replyUsername,
              parentColor && { color: lightenColor(parentColor) },
            ]}
          >
            @{parentDisplayName}
          </Text>
          {replyBody && (
            <Text style={styles.replyBodyText} numberOfLines={1}>
              {truncate(unescapeIrcTag(replyBody).trim(), 20)}
            </Text>
          )}
        </View>
      )}

      {isFirstMessage && (
        <View style={styles.firstMessageIndicator}>
          <Text style={styles.firstMessageText}>first message</Text>
        </View>
      )}

      {isSubscriptionNotice && (
        <View style={styles.subscriptionNoticeContainer}>
          {message.map(renderMessagePart)}
        </View>
      )}

      {!isSubscriptionNotice && (
        <View style={styles.messageRow}>
          <View style={styles.messageLine}>
            {!isSystemNotice && (
              <Text style={styles.timestamp}>
                {formatDate(new Date(), 'HH:mm')}:
              </Text>
            )}
            {renderBadges()}
            {userstate.username && (
              <Text
                style={[
                  styles.username,
                  styles.usernameDefaultColor,
                  // eslint-disable next-line react-native/no-inline-styles
                  userstate.color && { color: lightenColor(userstate.color) },
                ]}
              >
                {userstate.username}:
              </Text>
            )}
            {message.map(renderMessagePart)}
          </View>
          {canReply && (
            <Button
              onPress={handleReply}
              style={styles.replyButton}
              testID="reply-button"
            >
              <Icon icon="corner-up-left" size={14} color="#FFFFFF" />
            </Button>
          )}
        </View>
      )}
    </Button>
  );
}

const MemoizedChatMessage = memo(ChatMessageComponent);
MemoizedChatMessage.displayName = 'ChatMessage';

export const ChatMessage = MemoizedChatMessage as <
  TNoticeType extends NoticeVariants,
  TVariant extends TNoticeType extends 'usernotice'
    ? keyof UserNoticeVariantMap
    : never = never,
>(
  props: ChatMessageType<TNoticeType, TVariant> & {
    onReply: (args: OnReply<TNoticeType>) => void;
    onEmotePress?: (
      data: EmotePressData,
      position: { x: number; y: number; width: number; height: number },
    ) => void;
    onBadgePress?: (data: BadgePressData) => void;
    onMessageLongPress?: (data: MessageActionData<TNoticeType>) => void;
    getMentionColor?: (username: string) => string;
  },
) => React.JSX.Element;
const styles = StyleSheet.create(theme => ({
  chatContainer: {
    paddingVertical: theme.spacing.xs,
  },
  firstMessageContainer: {
    backgroundColor: 'rgba(0, 210, 106, 0.15)',
    padding: theme.spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 210, 106, 0.3)',
    marginBottom: theme.spacing.xs,
  },
  messageLine: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    flex: 1,
  },
  usernameButton: {
    flexShrink: 0,
  },
  messageWrapper: {
    width: '100%',
    marginBottom: 5,
  },
  firstLine: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    width: '100%',
  },
  inlineMessageContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    flex: 1,
    minWidth: 0,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    width: '100%',
  },
  replyButton: {
    padding: theme.spacing.sm,
    marginLeft: theme.spacing.xs,
    borderRadius: 6,
    backgroundColor: 'rgba(145, 71, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(145, 71, 255, 0.25)',
  },
  messagePrefix: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flexShrink: 0,
  },
  messageContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    flex: 1,
    minWidth: 0,
    marginLeft: 0,
  },
  line: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    width: '100%',
    marginBottom: 5,
  },
  badge: {
    width: 20,
    height: 20,
    marginRight: 2,
  },
  username: {
    marginRight: 5,
    fontWeight: 'bold',
  },
  usernameDefaultColor: {
    color: '#FFFFFF',
  },
  timestamp: {
    color: theme.colors.gray.accentAlpha,
    fontSize: theme.font.fontSize.xs,
  },
  mention: {
    marginHorizontal: 2,
  },
  mentionDefaultColor: {
    color: '#FFFFFF',
  },
  emote: {
    width: 25,
    height: 25,
    marginHorizontal: 2,
  },
  safeArea: {
    flex: 1,
  },
  bottomSheet: {
    // backgroundColor: theme.colors.borderFaint,
  },
  messageActionsContainer: {
    padding: 16,
  },
  messageActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  messageActionText: {
    marginLeft: 12,
  },
  replyContainer: {
    borderLeftWidth: 2,
    borderLeftColor: 'rgba(145, 71, 255, 0.5)',
    paddingLeft: theme.spacing.sm,
    marginLeft: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  replyIndicatorWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 4,
    flexWrap: 'wrap',
  },
  replyLabel: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 11,
  },
  replyUsername: {
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 11,
  },
  replyBodyText: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 11,
    fontStyle: 'italic',
    flexShrink: 1,
  },
  subscriptionNoticeContainer: {
    width: '100%',
  },
  messageText: {
    lineHeight: theme.spacing['2xl'],
  },
  firstMessageIndicator: {
    marginBottom: theme.spacing.xs,
  },
  firstMessageText: {
    color: '#00D26A',
    fontSize: theme.font.fontSize.xs,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
}));
