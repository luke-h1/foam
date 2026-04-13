/* eslint-disable camelcase */
import { useChannelPointRewardTitle } from '@app/hooks/useChannelPointRewardTitle';
import { SanitisedBadgeSet } from '@app/services/twitch-badge-service';
import type {
  ChatMessageType,
  UserPaint,
} from '@app/store/chatStore/constants';
import { theme } from '@app/styles/themes';
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
import React, { useCallback, memo, useMemo, type ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';
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
  login?: string;
  userId?: string;
  messageData: ChatMessageType<TNoticeType>;
};
export interface UsernamePressData {
  color?: string;
  login?: string;
  userId?: string;
  username: string;
}

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

const VIEWER_MILESTONE_TYPES = new Set<ParsedPart['type']>(['viewermilestone']);

function messageHasPart(
  message: ParsedPart[],
  types: Set<ParsedPart['type']>,
): boolean {
  return message.some(part => types.has(part.type));
}

function normaliseUsername(value: string | undefined): string {
  return value?.trim().replace(/^@/, '').toLowerCase() ?? '';
}

function messageMentionsUser(
  message: ParsedPart[],
  username: string | undefined,
): boolean {
  const target = normaliseUsername(username);
  if (!target) {
    return false;
  }

  return message.some(
    part =>
      part.type === 'mention' && normaliseUsername(part.content) === target,
  );
}

/**
 * Distinguishes how the message body should be laid out. Order of checks matters
 * (e.g. Twitch system notices before subscription Usernotice parts).
 */
type ChatBodyVariant =
  | 'twitch_system_notice'
  | 'subscription'
  | 'stv_emote_event'
  | 'viewer_milestone'
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
  if (messageHasPart(message, VIEWER_MILESTONE_TYPES)) {
    return 'viewer_milestone';
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
  onUsernamePress,
  currentUsername,
  density = 'comfortable',
  disableEmoteAnimations = false,
  showTimestamp = true,
  highlightedUsers = [],
  showInlineReplyContext = true,
}: ChatMessageType<TNoticeType, TVariant> & {
  onReply?: (args: ChatMessageType<TNoticeType>) => void;
  onBadgePress?: (data: BadgePressData) => void;
  onMessageLongPress?: (data: MessageActionData<TNoticeType>) => void;
  onEmotePress?: (data: EmotePressData) => void;
  getMentionColor?: (username: string) => string;
  parseTextForEmotes?: (text: string) => ParsedPart[];
  userPaints?: Record<string, UserPaint>;
  onUsernamePress?: (data: UsernamePressData) => void;
  currentUsername?: string;
  density?: 'comfortable' | 'compact';
  disableEmoteAnimations?: boolean;
  showTimestamp?: boolean;
  highlightedUsers?: string[];
  showInlineReplyContext?: boolean;
}) {
  void userPaints;
  const compact = density === 'compact';
  const mentionsCurrentUser = messageMentionsUser(message, currentUsername);
  const highlightedUserSet = useMemo(
    () => new Set(highlightedUsers.map(normaliseUsername).filter(Boolean)),
    [highlightedUsers],
  );
  const messageSenderKey = normaliseUsername(
    userstate.username || userstate.login || sender,
  );
  const isHighlightedSender =
    messageSenderKey.length > 0 && highlightedUserSet.has(messageSenderKey);

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

  const handleUsernamePress = useCallback(() => {
    if (!userstate.username) {
      return;
    }

    onUsernamePress?.({
      username: userstate.username,
      login: userstate.login,
      userId: userstate['user-id'],
      color: userstate.color,
    });
  }, [onUsernamePress, userstate]);

  const usernameElement = useMemo(() => {
    if (!userstate.username || isChannelPointRedemption) {
      return null;
    }

    const username = (
      <PaintedUsername
        username={userstate.username}
        userId={userstate['user-id']}
        fallbackColor={
          userstate.color ? lightenColor(userstate.color) : undefined
        }
        usernameTextStyle={compact ? styles.usernameCompact : undefined}
      />
    );

    if (!onUsernamePress) {
      return username;
    }

    return (
      <Button
        onPress={handleUsernamePress}
        style={styles.usernameButton}
        testID="chat-username-button"
      >
        {username}
      </Button>
    );
  }, [
    compact,
    handleUsernamePress,
    isChannelPointRedemption,
    onUsernamePress,
    userstate,
  ]);

  const renderMessagePart = useCallback(
    (part: ParsedPart, index: number) => {
      switch (part.type) {
        case 'text': {
          return (
            <Text
              key={index}
              color="gray.text"
              style={[styles.messageText, compact && styles.messageTextCompact]}
            >
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
              disableAnimations={disableEmoteAnimations}
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
          const isHighlightedMention =
            highlightedUserSet.has(normaliseUsername(mentionedUsername)) ||
            normaliseUsername(currentUsername) ===
              normaliseUsername(mentionedUsername);

          return (
            <Text key={`message-${index}`}>
              <Text
                style={[
                  styles.mention,
                  styles.mentionDefaultColor,
                  compact && styles.mentionCompact,
                  isHighlightedMention && styles.mentionHighlighted,
                  mentionColor && { color: lightenColor(mentionColor) },
                ]}
              >
                {part.content}
              </Text>
            </Text>
          );
        }

        case 'stv_emote_added': {
          return (
            <StvEmoteEvent
              disableAnimations={disableEmoteAnimations}
              part={part}
            />
          );
        }

        case 'stv_emote_removed': {
          return (
            <StvEmoteEvent
              disableAnimations={disableEmoteAnimations}
              part={part}
            />
          );
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
          return <ViewerMileStoneNotice key={index} part={part} />;
        }

        default:
          return null;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      handleEmotePress,
      compact,
      disableEmoteAnimations,
      getMentionColor,
      highlightedUserSet,
      parseTextForEmotes,
      notice_tags,
      userstate.username,
      userstate.color,
      message_id,
      currentUsername,
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
    bodyVariant !== 'viewer_milestone' &&
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
      login: userstate.login,
      userId: userstate['user-id'],
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
  const shouldRenderInlineReply =
    showInlineReplyContext &&
    isReply &&
    Boolean(replyBody || parentDisplayName);

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

      case 'viewer_milestone':
        return (
          <View style={styles.viewerMilestoneRow}>
            {showTimestamp ? (
              <Text
                style={[styles.timestamp, compact && styles.timestampCompact]}
              >
                {formatDate(new Date(), 'HH:mm')}:
              </Text>
            ) : null}
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
            {shouldRenderInlineReply ? (
              <View style={styles.replyContextRow}>
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
              </View>
            ) : null}
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
                {showTimestamp ? (
                  <Text
                    style={[
                      styles.timestamp,
                      compact && styles.timestampCompact,
                    ]}
                  >
                    {formatDate(new Date(), 'HH:mm')}:
                  </Text>
                ) : null}
                {renderBadges()}
                {usernameElement}
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
        compact && styles.chatContainerCompact,
        style,
        isAppSystemSender && styles.systemMessageContainer,
        isUserChat && isHighlightedSender && styles.highlightedSenderContainer,
        isReply && styles.replyContainer,
        mentionsCurrentUser && styles.ownMentionContainer,
        isFirstMessage && styles.firstMessageContainer,
        bodyVariant === 'viewer_milestone' && styles.viewerMilestoneContainer,
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
    onUsernamePress?: (data: UsernamePressData) => void;
    currentUsername?: string;
    density?: 'comfortable' | 'compact';
    disableEmoteAnimations?: boolean;
    showTimestamp?: boolean;
    highlightedUsers?: string[];
    showInlineReplyContext?: boolean;
  },
) => React.JSX.Element;
const styles = StyleSheet.create({
  badge: {
    height: 20,
    marginRight: 2,
    width: 20,
  },
  chatContainer: {
    maxHeight: 120,
    minHeight: 44,
    paddingVertical: theme.spacing.xs,
  },
  chatContainerCompact: {
    minHeight: 32,
    paddingVertical: 2,
  },
  firstMessageContainer: {
    backgroundColor: 'rgba(145, 71, 255, 0.08)',
    borderLeftColor: theme.colors.violet.accent,
    borderLeftWidth: 3,
    borderRightColor: theme.colors.violet.accent,
    borderRightWidth: 3,
    marginVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  firstMessageText: {
    color: 'rgba(145, 71, 255, 0.5)',
    fontSize: theme.font.fontSize.xs,
    fontStyle: 'italic',
    fontWeight: '500',
    textTransform: 'lowercase',
  },
  highlightedSenderContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderLeftColor: 'rgba(255, 255, 255, 0.25)',
    borderLeftWidth: 2,
    paddingLeft: theme.spacing.sm,
  },
  mention: {
    marginHorizontal: 2,
  },
  mentionCompact: {
    marginHorizontal: 1,
  },
  mentionDefaultColor: {
    color: '#FFFFFF',
  },
  mentionHighlighted: {
    fontWeight: '700',
  },
  messageColumn: {
    flexDirection: 'column',
    width: '100%',
  },
  messageLine: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    flexWrap: 'wrap',
    flex: 1,
  },
  messageRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  messageText: {
    lineHeight: theme.spacing['2xl'],
  },
  messageTextCompact: {
    fontSize: theme.font.fontSize.xs,
    lineHeight: theme.spacing.xl,
  },
  ownMentionContainer: {
    backgroundColor: 'rgba(145, 71, 255, 0.1)',
    borderLeftColor: theme.colors.violet.accent,
    borderLeftWidth: 3,
    paddingLeft: theme.spacing.sm,
  },
  replyContainer: {
    borderLeftColor: 'rgba(145, 71, 255, 0.5)',
    borderLeftWidth: 2,
    marginBottom: theme.spacing.md,
    marginLeft: theme.spacing.sm,
    paddingLeft: theme.spacing.sm,
  },
  replyContextBody: {
    color: theme.colors.gray.textLow,
    fontSize: theme.font.fontSize.xs,
    maxWidth: '75%',
  },
  replyContextBodyCompact: {
    fontSize: theme.font.fontSize.xxs,
  },
  replyContextLabel: {
    color: theme.colors.gray.text,
    fontSize: theme.font.fontSize.xs,
    fontWeight: '600',
  },
  replyContextLabelCompact: {
    fontSize: theme.font.fontSize.xxs,
  },
  replyContextRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },
  rewardMessageContainer: {
    backgroundColor: 'rgba(127, 127, 127, 0.06)',
    borderLeftColor: theme.colors.violet.accent,
    borderLeftWidth: 3,
    borderRightColor: theme.colors.violet.accent,
    borderRightWidth: 3,
    marginVertical: theme.spacing.xs,
    paddingLeft: theme.spacing.sm,
    paddingRight: theme.spacing.xs,
    paddingVertical: theme.spacing.xs,
  },
  rewardSummaryMuted: {
    color: theme.colors.gray.textLow,
    fontWeight: '400',
  },
  rewardSummaryName: {
    color: theme.colors.gray.text,
    fontWeight: '700',
  },
  rewardSummaryRewardTitle: {
    color: theme.colors.gray.text,
    fontWeight: '700',
  },
  rewardSummaryRow: {
    marginBottom: theme.spacing.xs,
    width: '100%',
  },
  rewardSummaryText: {
    flexWrap: 'wrap',
  },
  rightActions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.xs,
    marginLeft: theme.spacing.xs,
  },
  stvSystemRowAlignStart: {
    alignItems: 'flex-start',
  },
  subscriptionNoticeContainer: {
    width: '100%',
  },
  systemMessageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  systemMessageRow: {
    alignItems: 'center',
    width: '100%',
  },
  systemMessageText: {
    color: theme.colors.gray.textLow,
    fontStyle: 'italic',
    lineHeight: theme.spacing['2xl'],
    textAlign: 'center',
  },
  timestamp: {
    color: theme.colors.gray.accentAlpha,
    fontSize: theme.font.fontSize.xs,
  },
  timestampCompact: {
    fontSize: theme.font.fontSize.xxs,
    marginRight: 2,
  },
  usernameButton: {
    alignSelf: 'center',
  },
  usernameCompact: {
    fontSize: theme.font.fontSize.xs,
  },
  viewerMilestoneContainer: {
    backgroundColor: 'rgba(145, 71, 255, 0.08)',
    borderLeftColor: theme.colors.violet.accent,
    borderLeftWidth: 3,
    marginVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  viewerMilestoneRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
  },
});
