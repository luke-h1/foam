/* eslint-disable camelcase */
import { useChannelPointRewardTitle } from '@app/hooks/useChannelPointRewardTitle';
import { SanitisedBadgeSet } from '@app/services/twitch-badge-service';
import type {
  ChatMessageType,
  UserPaint,
} from '@app/store/chatStore/constants';
import { NoticeVariants } from '@app/types/chat/irc-tags/noticevariant';
import {
  UserNoticeVariantMap,
  UserNoticeTags,
} from '@app/types/chat/irc-tags/usernotice';
import { channelPointsRewardTitleFromUserstate } from '@app/utils/chat/channelPointsRewardTitle';
import { generateRandomTwitchColor } from '@app/utils/chat/generateRandomTwitchColor';
import { ParsedPart } from '@app/utils/chat/replaceTextWithEmotes';
import { lightenColor } from '@app/utils/color/lightenColor';
import { formatDate } from '@app/utils/date-time/date';
import React, { useCallback, memo, type ReactNode } from 'react';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Button } from '../../../Button/Button';
import { Image } from '../../../Image/Image';
import { Text } from '../../../Text/Text';
import { MediaLinkCard } from '../MediaLinkCard';
import { StvEmoteEvent } from '../StvEmoteEvent';
import { SubscriptionNotice } from '../usernotices/SubscriptionNotice';
import { ViewerMileStoneNotice } from '../usernotices/ViewerMilestoneNotice';
import { PaintedUsername } from './CosmeticUsername/CosmeticUsername';
import { EmoteRenderer } from './renderers/EmoteRenderer';

export type EmotePressData = ParsedPart<'emote'>;
export type BadgePressData = SanitisedBadgeSet;
export type MessageActionData<TNoticeType extends NoticeVariants> = {
  message: ParsedPart[];
  username?: string;
  messageData: ChatMessageType<TNoticeType>;
};

const SUBSCRIPTION_NOTICE_TYPES = new Set<ParsedPart['type']>([
  'sub',
  'resub',
  'anongiftpaidupgrade',
  'anongift',
]);

const STV_EMOTE_EVENT_TYPES = new Set<ParsedPart['type']>([
  'stv_emote_added',
  'stv_emote_removed',
]);

function messageHasPart(
  message: ParsedPart[],
  types: Set<ParsedPart['type']>,
): boolean {
  return message.some(part => types.has(part.type));
}

/**
 * Distinguishes how the message body should be laid out. Order of checks matters
 * (e.g. Twitch system notices before subscription Usernotice parts).
 */
type ChatBodyVariant =
  | 'twitch_system_notice'
  | 'subscription'
  | 'stv_emote_event'
  | 'app_system_sender'
  | 'user_chat';

function getChatBodyVariant(
  isTwitchSystemNotice: boolean | undefined,
  message: ParsedPart[],
  sender: string | undefined,
): ChatBodyVariant {
  if (isTwitchSystemNotice) {
    return 'twitch_system_notice';
  }
  if (messageHasPart(message, SUBSCRIPTION_NOTICE_TYPES)) {
    return 'subscription';
  }
  if (messageHasPart(message, STV_EMOTE_EVENT_TYPES)) {
    return 'stv_emote_event';
  }
  if (sender?.toLowerCase() === 'system') {
    return 'app_system_sender';
  }
  return 'user_chat';
}

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
  parentColor: _,
  notice_tags,
  onReply,
  onBadgePress,
  onMessageLongPress,
  onEmotePress,
  getMentionColor,
  parseTextForEmotes,
  userPaints,
  isChannelPointRedemption,
  isTwitchSystemNotice,
}: ChatMessageType<TNoticeType, TVariant> & {
  onReply?: (args: ChatMessageType<TNoticeType>) => void;
  onBadgePress?: (data: BadgePressData) => void;
  onMessageLongPress?: (data: MessageActionData<TNoticeType>) => void;
  onEmotePress?: (data: EmotePressData) => void;
  getMentionColor?: (username: string) => string;
  parseTextForEmotes?: (text: string) => ParsedPart[];
  userPaints?: Record<string, UserPaint>;
}) {
  void userPaints;

  const handleEmotePress = useCallback(
    (part: EmotePressData) => {
      onEmotePress?.(part);
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
      handleEmotePress,
      getMentionColor,
      parseTextForEmotes,
      notice_tags,
      userstate.username,
      userstate.color,
      message_id,
    ],
  );

  const renderSystemMessagePart = useCallback(
    (part: ParsedPart, index: number) => {
      if (part.type === 'text') {
        return (
          <Text key={index} style={styles.systemMessageText}>
            {part.content}
          </Text>
        );
      }

      return renderMessagePart(part, index);
    },
    [renderMessagePart],
  );

  const renderBadges = useCallback(() => {
    return badges?.map((badge, index) => (
      <Button
        // eslint-disable-next-line react/no-array-index-key
        key={`${badge.set}-${badge.id}-${badge.type}-${badge.url}-${index}`}
        onPress={() => handleBadgePress(badge)}
      >
        <Image
          useNitro
          source={badge.url}
          style={styles.badge}
          transition={0}
        />
      </Button>
    ));
  }, [badges, handleBadgePress]);

  const bodyVariant = getChatBodyVariant(isTwitchSystemNotice, message, sender);

  const isAppSystemSender = bodyVariant === 'app_system_sender';
  const isUserChat = bodyVariant === 'user_chat';
  const showChannelPointsRewardChrome =
    isUserChat && isChannelPointRedemption && Boolean(userstate.username);

  const rewardTitleIrc = showChannelPointsRewardChrome
    ? channelPointsRewardTitleFromUserstate(userstate)
    : undefined;
  const roomId =
    typeof userstate['room-id'] === 'string' ? userstate['room-id'] : undefined;
  const rewardId =
    typeof userstate['custom-reward-id'] === 'string'
      ? userstate['custom-reward-id']
      : undefined;
  const rewardTitleApi = useChannelPointRewardTitle(
    roomId,
    rewardId,
    Boolean(
      showChannelPointsRewardChrome && !rewardTitleIrc && roomId && rewardId,
    ),
  );
  const rewardSummaryTitle =
    rewardTitleIrc ?? rewardTitleApi ?? 'Channel Points reward';

  const canReply =
    onReply &&
    !messageHasPart(message, SUBSCRIPTION_NOTICE_TYPES) &&
    bodyVariant !== 'stv_emote_event' &&
    userstate.username &&
    sender?.toLowerCase() !== 'system';

  const handleLongPress = useCallback(() => {
    const messageData = {
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
    } as ChatMessageType<TNoticeType>;

    if (canReply) {
      onReply?.(messageData);
    }
    onMessageLongPress?.({
      message,
      username: userstate.username,
      messageData,
    });
  }, [
    onReply,
    canReply,
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

  const isReply = Boolean(parentDisplayName);
  const isFirstMessage = userstate['first-msg'] === '1';

  const renderChatBody = (): ReactNode => {
    switch (bodyVariant) {
      case 'twitch_system_notice':
        return null;

      case 'subscription':
        return (
          <View style={styles.subscriptionNoticeContainer}>
            {message.map(renderMessagePart)}
          </View>
        );

      case 'stv_emote_event':
        return (
          <View
            style={[styles.systemMessageRow, styles.stvSystemRowAlignStart]}
          >
            {message.map(renderMessagePart)}
          </View>
        );

      case 'app_system_sender':
        return (
          <View style={styles.systemMessageRow}>
            {message.map(renderSystemMessagePart)}
          </View>
        );

      case 'user_chat': {
        return (
          <View style={styles.messageColumn}>
            {showChannelPointsRewardChrome ? (
              <View style={styles.rewardSummaryRow}>
                <Text style={styles.rewardSummaryText}>
                  <Text style={styles.rewardSummaryName}>
                    {userstate.username}
                  </Text>
                  <Text style={styles.rewardSummaryMuted}> redeemed </Text>
                  <Text style={styles.rewardSummaryRewardTitle}>
                    {rewardSummaryTitle}
                  </Text>
                </Text>
              </View>
            ) : null}
            <View style={styles.messageRow}>
              <View style={styles.messageLine}>
                <Text style={styles.timestamp}>
                  {formatDate(new Date(), 'HH:mm')}:
                </Text>
                {renderBadges()}
                {userstate.username && !isChannelPointRedemption ? (
                  <PaintedUsername
                    username={userstate.username}
                    userId={userstate['user-id']}
                    fallbackColor={
                      userstate.color
                        ? lightenColor(userstate.color)
                        : undefined
                    }
                  />
                ) : null}
                {message.map(renderMessagePart)}
              </View>
              <View style={styles.rightActions}>
                {isFirstMessage ? (
                  <Text style={styles.firstMessageText}>first message</Text>
                ) : null}
              </View>
            </View>
          </View>
        );
      }

      default: {
        const unreachable: never = bodyVariant;
        return unreachable;
      }
    }
  };

  if (bodyVariant === 'twitch_system_notice') {
    return (
      <Button
        testID="chat-message"
        onLongPress={handleLongPress}
        style={[styles.chatContainer, style]}
      >
        <View style={styles.systemMessageRow}>
          {message.map(renderSystemMessagePart)}
        </View>
      </Button>
    );
  }

  return (
    <Button
      testID="chat-message"
      onLongPress={handleLongPress}
      style={[
        styles.chatContainer,
        style,
        isAppSystemSender && styles.systemMessageContainer,
        isReply && styles.replyContainer,
        isFirstMessage && styles.firstMessageContainer,
        isChannelPointRedemption && isUserChat && styles.rewardMessageContainer,
      ]}
    >
      {renderChatBody()}
    </Button>
  );
}

const MemoizedRichChatMessage = memo(ChatMessageComponent);
MemoizedRichChatMessage.displayName = 'RichChatMessage';

export const RichChatMessage = MemoizedRichChatMessage as <
  TNoticeType extends NoticeVariants,
  TVariant extends TNoticeType extends 'usernotice'
    ? keyof UserNoticeVariantMap
    : never = never,
>(
  props: ChatMessageType<TNoticeType, TVariant> & {
    onReply?: (args: ChatMessageType<TNoticeType>) => void;
    onBadgePress?: (data: BadgePressData) => void;
    onMessageLongPress?: (data: MessageActionData<TNoticeType>) => void;
    onEmotePress?: (data: EmotePressData) => void;
    getMentionColor?: (username: string) => string;
    parseTextForEmotes?: (text: string) => ParsedPart[];
    userPaints?: Record<string, UserPaint>;
  },
) => React.JSX.Element;
const styles = StyleSheet.create(theme => ({
  chatContainer: {
    paddingVertical: theme.spacing.xs,
    minHeight: 44,
    maxHeight: 120,
  },
  systemMessageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  systemMessageRow: {
    width: '100%',
    alignItems: 'center',
  },
  stvSystemRowAlignStart: {
    alignItems: 'flex-start',
  },
  messageColumn: {
    width: '100%',
    flexDirection: 'column',
  },
  rewardMessageContainer: {
    backgroundColor: 'rgba(127, 127, 127, 0.06)',
    borderLeftWidth: 3,
    borderRightWidth: 3,
    borderLeftColor: theme.colors.violet.accent,
    borderRightColor: theme.colors.violet.accent,
    paddingLeft: theme.spacing.sm,
    paddingRight: theme.spacing.xs,
    paddingVertical: theme.spacing.xs,
    marginVertical: theme.spacing.xs,
  },
  rewardSummaryRow: {
    width: '100%',
    marginBottom: theme.spacing.xs,
  },
  rewardSummaryText: {
    flexWrap: 'wrap',
  },
  rewardSummaryName: {
    color: theme.colors.gray.text,
    fontWeight: '700',
  },
  rewardSummaryMuted: {
    color: theme.colors.gray.textLow,
    fontWeight: '400',
  },
  rewardSummaryRewardTitle: {
    color: theme.colors.gray.text,
    fontWeight: '700',
  },
  systemMessageText: {
    color: theme.colors.gray.textLow,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: theme.spacing['2xl'],
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
