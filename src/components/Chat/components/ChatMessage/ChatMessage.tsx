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
import { lightenColor } from '@app/utils/color/lightenColor';
import { formatDate } from '@app/utils/date-time/date';
import React, { useCallback, memo } from 'react';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Button } from '../../../Button/Button';
import { IconSymbol } from '../../../IconSymbol/IconSymbol';
import { Image } from '../../../Image/Image';
import { Text } from '../../../Text/Text';
import { MediaLinkCard } from '../MediaLinkCard';
import { StvEmoteEvent } from '../StvEmoteEvent';
import { SubscriptionNotice } from '../usernotices/SubscriptionNotice';
import { ViewerMileStoneNotice } from '../usernotices/ViewerMilestoneNotice';
import { PaintedUsername } from './CosmeticUsername/CosmeticUsername';
import { EmoteRenderer } from './renderers/EmoteRenderer';

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
  parseTextForEmotes,
}: ChatMessageType<TNoticeType, TVariant> & {
  onReply: (args: OnReply<TNoticeType>) => void;
  onEmotePress?: (data: EmotePressData) => void;
  onBadgePress?: (data: BadgePressData) => void;
  onMessageLongPress?: (data: MessageActionData<TNoticeType>) => void;
  getMentionColor?: (username: string) => string;
  parseTextForEmotes?: (text: string) => ParsedPart[];
}) {
  const isSubscriptionNotice = message.some(
    part =>
      part.type === 'sub' ||
      part.type === 'resub' ||
      part.type === 'anongiftpaidupgrade' ||
      part.type === 'anongift',
  );

  const handleEmotePress = useCallback(
    (part: ParsedPart) => {
      if (part.type === 'emote') {
        onEmotePress?.(part);
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

          // TODO: - update to process 7tv paint if set
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
          const subMessage = part.subscriptionEvent?.message;
          const parsedSubMessage =
            subMessage && parseTextForEmotes
              ? parseTextForEmotes(subMessage)
              : undefined;

          if (notice_tags) {
            return (
              <SubscriptionNotice
                part={part}
                notice_tags={notice_tags as UserNoticeTags}
                parsedMessage={parsedSubMessage}
              />
            );
          }
          return (
            <SubscriptionNotice part={part} parsedMessage={parsedSubMessage} />
          );
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

  const isSystemSender =
    sender === 'System' ||
    sender === 'system' ||
    userstate.username === 'System' ||
    userstate.username === 'system';

  const isMilestoneNotice = message.some(
    part => part.type === 'viewermilestone',
  );

  const canReply =
    !isSystemNotice &&
    !isSubscriptionNotice &&
    !isMilestoneNotice &&
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
          <Text style={styles.replyLabel}>↳</Text>
          <Text
            style={[
              styles.replyUsername,
              parentColor && { color: lightenColor(parentColor) },
            ]}
          >
            @{parentDisplayName}
          </Text>
          {replyBody ? (
            <Text
              style={styles.replyBodyPreview}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {replyBody}
            </Text>
          ) : null}
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
              <PaintedUsername
                username={userstate.username}
                userId={userstate['user-id']}
                fallbackColor={
                  userstate.color ? lightenColor(userstate.color) : undefined
                }
              />
            )}
            {message.map(renderMessagePart)}
          </View>
          <View style={styles.rightActions}>
            {isFirstMessage && (
              <Text style={styles.firstMessageText}>first message</Text>
            )}
            {canReply && (
              <Button
                onPress={handleReply}
                style={styles.replyButton}
                testID="reply-button"
              >
                <IconSymbol
                  name="arrowshape.turn.up.left"
                  size={16}
                  color="rgba(255, 255, 255, 0.5)"
                  weight="medium"
                />
              </Button>
            )}
          </View>
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
    onEmotePress?: (data: EmotePressData) => void;
    onBadgePress?: (data: BadgePressData) => void;
    onMessageLongPress?: (data: MessageActionData<TNoticeType>) => void;
    getMentionColor?: (username: string) => string;
    parseTextForEmotes?: (text: string) => ParsedPart[];
  },
) => React.JSX.Element;
const styles = StyleSheet.create(theme => ({
  chatContainer: {
    paddingVertical: theme.spacing.xs,
  },
  firstMessageContainer: {
    backgroundColor: 'rgba(145, 71, 255, 0.08)',
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    borderLeftWidth: 3,
    borderRightWidth: 3,
    borderLeftColor: theme.colors.violet.accent,
    borderRightColor: theme.colors.violet.accent,
    marginVertical: theme.spacing.xs,
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
    padding: theme.spacing.xs,
    marginLeft: theme.spacing.xs,
    opacity: 0.4,
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
    marginBottom: 2,
    gap: 3,
  },
  replyLabel: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 10,
  },
  replyUsername: {
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 10,
  },
  replyBodyPreview: {
    color: 'rgba(255, 255, 255, 0.35)',
    fontSize: 10,
    flexShrink: 1,
  },
  subscriptionNoticeContainer: {
    width: '100%',
  },
  messageText: {
    lineHeight: theme.spacing['2xl'],
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginLeft: theme.spacing.xs,
  },
  firstMessageText: {
    color: 'rgba(145, 71, 255, 0.5)',
    fontSize: theme.font.fontSize.xs,
    fontWeight: '500',
    textTransform: 'lowercase',
    fontStyle: 'italic',
  },
}));
