/* eslint-disable camelcase */
import { useChannelPointRewardTitle } from '@app/hooks/useChannelPointRewardTitle';
import { SanitisedBadgeSet } from '@app/services/twitch-badge-service';
import type { ChatMessageType } from '@app/store/chatStore/constants';
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
  'submysterygift',
  'giftpaidupgrade',
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
  for (const part of message) {
    if (types.has(part.type)) {
      return true;
    }
  }

  return false;
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

  for (const part of message) {
    if (part.type === 'mention' && normaliseUsername(part.content) === target) {
      return true;
    }
  }

  return false;
}

function renderParts(
  message: ParsedPart[],
  renderer: (part: ParsedPart, index: number) => ReactNode,
): ReactNode[] {
  const renderedParts = new Array<ReactNode>(message.length);
  let index = 0;
  for (const part of message) {
    renderedParts[index] = renderer(part, index);
    index += 1;
  }

  return renderedParts;
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

interface SpecialChatBodyProps {
  bodyVariant: Exclude<ChatBodyVariant, 'user_chat'>;
  compact: boolean;
  message: ParsedPart[];
  renderMessagePart: (part: ParsedPart, index: number) => ReactNode;
  renderSystemMessagePart: (part: ParsedPart, index: number) => ReactNode;
  showTimestamp: boolean;
  timestamp?: string;
}

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

const SpecialChatBody = memo(
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
                style={[styles.timestamp, compact && styles.timestampCompact]}
              >
                {timestamp}:
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
                style={[styles.timestamp, compact && styles.timestampCompact]}
              >
                {timestamp}:
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
                style={[styles.timestamp, compact && styles.timestampCompact]}
              >
                {timestamp}:
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
                style={[styles.timestamp, compact && styles.timestampCompact]}
              >
                {timestamp}:
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
  timestamp,
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
  isChannelPointRedemption,
  isTwitchSystemNotice,
  onUsernamePress,
  currentUsername,
  currentUsernameNormalized,
  density = 'comfortable',
  disableEmoteAnimations = false,
  showTimestamp = true,
  highlightedUserSet,
  highlightedUsers,
  showInlineReplyContext = true,
  moderationNotice,
  onReplyContextPress,
  highlightedMessageId,
}: ChatMessageType<TNoticeType, TVariant> & {
  onReply?: (args: ChatMessageType<TNoticeType>) => void;
  onBadgePress?: (data: BadgePressData) => void;
  onMessageLongPress?: (data: MessageActionData<TNoticeType>) => void;
  onEmotePress?: (data: EmotePressData) => void;
  getMentionColor?: (username: string) => string;
  parseTextForEmotes?: (text: string) => ParsedPart[];
  onUsernamePress?: (data: UsernamePressData) => void;
  currentUsername?: string;
  currentUsernameNormalized?: string;
  density?: 'comfortable' | 'compact';
  disableEmoteAnimations?: boolean;
  showTimestamp?: boolean;
  highlightedUserSet?: ReadonlySet<string>;
  highlightedUsers?: string[];
  showInlineReplyContext?: boolean;
  onReplyContextPress?: (replyParentMessageId: string) => void;
  highlightedMessageId?: string;
}) {
  const compact = density === 'compact';
  const mentionsCurrentUser = messageMentionsUser(message, currentUsername);
  const fallbackHighlightedUserSet = useMemo(() => {
    if (!highlightedUsers?.length) {
      return undefined;
    }

    return new Set(highlightedUsers.map(normaliseUsername));
  }, [highlightedUsers]);
  const effectiveHighlightedUserSet =
    highlightedUserSet ?? fallbackHighlightedUserSet;
  const messageSenderKey = normaliseUsername(
    userstate.username || userstate.login || sender,
  );
  const isHighlightedSender =
    messageSenderKey.length > 0 &&
    effectiveHighlightedUserSet?.has(messageSenderKey);

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
              style={[
                styles.messageText,
                compact && styles.messageTextCompact,
                moderationNotice && styles.moderatedMessageText,
              ]}
            >
              {part.content}
            </Text>
          );
        }

        case 'stvEmote': {
          return (
            <MediaLinkCard key={index} type="stvEmote" url={part.content} />
          );
        }

        case 'twitchClip': {
          return (
            <MediaLinkCard key={index} type="twitchClip" url={part.content} />
          );
        }

        case 'emote': {
          const previousPart = message[index - 1];
          const shouldOverlayPrevious =
            Boolean(part.zero_width) && previousPart?.type === 'emote';

          return (
            <EmoteRenderer
              disableAnimations={disableEmoteAnimations}
              key={index}
              part={part}
              handleEmotePress={handleEmotePress}
              shouldOverlayPrevious={shouldOverlayPrevious}
              targetSize={compact ? 24 : 30}
            />
          );
        }

        case 'mention': {
          const mentionedUsername = part.content.replace(/^@/, '').trim();
          const mentionColor = getMentionColor
            ? getMentionColor(mentionedUsername)
            : generateRandomTwitchColor(mentionedUsername);
          const isHighlightedMention =
            effectiveHighlightedUserSet?.has(
              normaliseUsername(mentionedUsername),
            ) ||
            currentUsernameNormalized === normaliseUsername(mentionedUsername);

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
              key={index}
              disableAnimations={disableEmoteAnimations}
              part={part}
            />
          );
        }

        case 'stv_emote_removed': {
          return (
            <StvEmoteEvent
              key={index}
              disableAnimations={disableEmoteAnimations}
              part={part}
            />
          );
        }

        case 'sub':
        case 'resub':
        case 'submysterygift':
        case 'giftpaidupgrade':
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
                key={index}
                part={part}
                notice_tags={notice_tags as UserNoticeTags}
                parsedMessage={parsedSubMessage}
              />
            );
          }
          return (
            <SubscriptionNotice
              key={index}
              part={part}
              parsedMessage={parsedSubMessage}
            />
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
      effectiveHighlightedUserSet,
      parseTextForEmotes,
      notice_tags,
      userstate.username,
      userstate.color,
      message_id,
      currentUsernameNormalized,
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
    if (!badges?.length) {
      return null;
    }

    const renderedBadges = new Array<ReactNode>(badges.length);
    let index = 0;
    for (const badge of badges) {
      renderedBadges[index] = (
        <Button
          key={`${badge.set}-${badge.id}-${badge.type}-${badge.url}-${index}`}
          onPress={() => handleBadgePress(badge)}
        >
          <Image
            useNitro
            source={badge.url}
            style={[
              styles.badge,
              compact && styles.badgeCompact,
              moderationNotice && styles.moderatedBadge,
            ]}
            transition={0}
          />
        </Button>
      );
      index += 1;
    }

    return renderedBadges;
  }, [badges, compact, handleBadgePress, moderationNotice]);

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
    !moderationNotice &&
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
      moderationNotice,
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
    moderationNotice,
    parentDisplayName,
    replyBody,
    replyDisplayName,
  ]);

  const isReply = Boolean(parentDisplayName);
  const replyParentMessageId = userstate['reply-parent-msg-id'];
  const isFirstMessage = userstate['first-msg'] === '1';
  const isHighlightedMessageTarget =
    Boolean(highlightedMessageId) && message_id === highlightedMessageId;
  const shouldRenderInlineReply =
    showInlineReplyContext &&
    isReply &&
    Boolean(replyBody || parentDisplayName);
  const canJumpToReplyTarget =
    Boolean(onReplyContextPress) && Boolean(replyParentMessageId);

  const renderChatBody = (): ReactNode => {
    switch (bodyVariant) {
      case 'user_chat': {
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
                testID="chat-reply-context-button"
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
            <View style={styles.messageLine}>
              {showTimestamp && timestamp ? (
                <Text
                  style={[styles.timestamp, compact && styles.timestampCompact]}
                >
                  {timestamp}:
                </Text>
              ) : null}
              {renderBadges()}
              {usernameElement ? (
                <View
                  style={
                    moderationNotice ? styles.moderatedUsernameContainer : null
                  }
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

      default: {
        return (
          <SpecialChatBody
            bodyVariant={bodyVariant}
            compact={compact}
            message={message}
            renderMessagePart={renderMessagePart}
            renderSystemMessagePart={renderSystemMessagePart}
            showTimestamp={showTimestamp}
            timestamp={timestamp}
          />
        );
      }
    }
  };

  return (
    <Button
      testID="chat-message"
      onLongPress={handleLongPress}
      style={[
        styles.chatContainer,
        compact && styles.chatContainerCompact,
        style,
        isAppSystemSender && styles.systemMessageContainer,
        isUserChat &&
          isHighlightedMessageTarget &&
          styles.highlightedReplyTargetContainer,
        isUserChat && isHighlightedSender && styles.highlightedSenderContainer,
        isUserChat && isReply && styles.replyContainer,
        isUserChat && mentionsCurrentUser && styles.ownMentionContainer,
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
    onUsernamePress?: (data: UsernamePressData) => void;
    currentUsername?: string;
    currentUsernameNormalized?: string;
    density?: 'comfortable' | 'compact';
    disableEmoteAnimations?: boolean;
    showTimestamp?: boolean;
    highlightedUsers?: string[];
    highlightedUserSet?: ReadonlySet<string>;
    showInlineReplyContext?: boolean;
    onReplyContextPress?: (replyParentMessageId: string) => void;
    highlightedMessageId?: string;
  },
) => React.JSX.Element;
const styles = StyleSheet.create({
  badge: {
    height: 20,
    marginRight: 2,
    width: 20,
  },
  badgeCompact: {
    height: 16,
    width: 16,
  },
  chatContainer: {
    minHeight: 32,
    paddingVertical: 2,
  },
  chatContainerCompact: {
    minHeight: 22,
    paddingVertical: 0,
  },
  moderatedBadge: {
    opacity: 0.72,
  },
  moderatedUsernameContainer: {
    opacity: 0.72,
  },
  highlightedSenderContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.025)',
    borderLeftColor: 'rgba(255, 255, 255, 0.18)',
    borderLeftWidth: 2,
    paddingLeft: theme.space8,
  },
  highlightedReplyTargetContainer: {
    backgroundColor: 'rgba(145, 71, 255, 0.08)',
    borderLeftColor: 'rgba(145, 71, 255, 0.42)',
    borderLeftWidth: 2,
    paddingLeft: theme.space8,
  },
  inlineIndicatorText: {
    color: 'rgba(145, 71, 255, 0.72)',
    fontSize: theme.fontSize11,
    fontWeight: '600',
    marginRight: 4,
    textTransform: 'lowercase',
  },
  inlineIndicatorTextCompact: {
    marginRight: 2,
  },
  mention: {
    marginHorizontal: 2,
  },
  mentionCompact: {
    fontSize: theme.fontSize11,
    lineHeight: 14,
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
  messageText: {
    lineHeight: theme.space20,
  },
  messageTextCompact: {
    fontSize: theme.fontSize11,
    lineHeight: 14,
  },
  moderatedMessageText: {
    color: 'rgba(214, 214, 217, 0.72)',
    fontStyle: 'italic',
  },
  ownMentionContainer: {
    backgroundColor: 'rgba(145, 71, 255, 0.06)',
    borderLeftColor: theme.colorViolet,
    borderLeftWidth: 2,
    paddingLeft: theme.space8,
  },
  replyContainer: {
    borderLeftColor: 'rgba(145, 71, 255, 0.28)',
    borderLeftWidth: 2,
    marginBottom: theme.space12,
    marginLeft: theme.space8,
    paddingLeft: theme.space8,
  },
  replyContextBody: {
    color: theme.color.textSecondary.dark,
    fontSize: theme.fontSize12,
    maxWidth: '75%',
  },
  replyContextBodyCompact: {
    fontSize: theme.fontSize11,
  },
  replyContextLabel: {
    color: theme.color.text.dark,
    fontSize: theme.fontSize12,
    fontWeight: '600',
  },
  replyContextLabelCompact: {
    fontSize: theme.fontSize11,
  },
  replyContextRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.space8,
    marginBottom: 2,
  },
  replyContextRowInteractive: {
    alignSelf: 'flex-start',
  },
  rewardMessageContainer: {
    backgroundColor: 'rgba(127, 127, 127, 0.04)',
    borderLeftColor: theme.colorViolet,
    borderLeftWidth: 2,
    marginVertical: 2,
    paddingLeft: theme.space8,
    paddingRight: theme.space8,
    paddingVertical: 2,
  },
  rewardSummaryMuted: {
    color: theme.color.textSecondary.dark,
    fontWeight: '400',
  },
  rewardSummaryName: {
    color: theme.color.text.dark,
    fontWeight: '700',
  },
  rewardSummaryRewardTitle: {
    color: theme.color.text.dark,
    fontWeight: '700',
  },
  rewardSummaryRow: {
    marginBottom: theme.space8,
    width: '100%',
  },
  rewardSummaryText: {
    flexWrap: 'wrap',
  },
  stvSystemRowAlignStart: {
    alignItems: 'flex-start',
  },
  subscriptionNoticeContainer: {
    width: '100%',
  },
  systemMessageContainer: {
    justifyContent: 'flex-start',
  },
  systemMessageRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
  },
  systemMessageText: {
    color: theme.color.textSecondary.dark,
    lineHeight: theme.space20,
    textAlign: 'left',
  },
  timestamp: {
    color: theme.colorGreyAlpha,
    fontSize: theme.fontSize11,
  },
  timestampCompact: {
    fontSize: 10,
    marginRight: 2,
  },
  usernameButton: {
    alignSelf: 'center',
  },
  usernameCompact: {
    fontSize: theme.fontSize11,
  },
  viewerMilestoneContainer: {
    backgroundColor: 'rgba(145, 71, 255, 0.05)',
    borderLeftColor: theme.colorViolet,
    borderLeftWidth: 2,
    marginVertical: 2,
    paddingHorizontal: theme.space8,
    paddingVertical: 2,
  },
  viewerMilestoneRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
  },
});
