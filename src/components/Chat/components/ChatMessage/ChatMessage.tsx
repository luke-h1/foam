/* eslint-disable camelcase */
import { SanitisedBadgeSet } from '@app/services/twitch-badge-service';
import { ChatMessageType } from '@app/store/chatStore';
import { NoticeVariants } from '@app/types/chat/irc-tags/noticevariant';
import {
  UserNoticeVariantMap,
  UserNoticeTags,
} from '@app/types/chat/irc-tags/usernotice';
import { generateRandomTwitchColor } from '@app/utils/chat/generateRandomTwitchColor';
import { replaceEmotesWithText } from '@app/utils/chat/replaceEmotesWithText';
import { ParsedPart } from '@app/utils/chat/replaceTextWithEmotes';
import { unescapeIrcTag } from '@app/utils/chat/unescapeIrcTag';
import { lightenColor } from '@app/utils/color/lightenColor';
import { formatDate } from '@app/utils/date-time/date';
import { truncate } from '@app/utils/string/truncate';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import * as Clipboard from 'expo-clipboard';
import React, { useRef, useCallback, memo, useState } from 'react';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { toast } from 'sonner-native';
import { Button } from '../../../Button';
import { Icon } from '../../../Icon';
import { Image } from '../../../Image';
import { Typography } from '../../../Typography';
import { ActionSheet } from '../ActionSheet';
import { BadgePreviewSheet } from '../BadgePreviewSheet';
import { EmotePreviewSheet } from '../EmotePreviewSheet';
import { MediaLinkCard } from '../MediaLinkCard';
import { StvEmoteEvent } from '../StvEmoteEvent';
import { SubscriptionNotice } from '../usernotices/SubscriptionNotice';
import { ViewerMileStoneNotice } from '../usernotices/ViewerMilestoneNotice';
import { EmoteRenderer } from './renderers';

type OnReply<TNoticeType extends NoticeVariants> = Omit<
  ChatMessageType<TNoticeType>,
  'style'
>;

function ChatMessageComponent<
  TNoticeType extends NoticeVariants,
  TVariant extends TNoticeType extends 'usernotice'
    ? keyof UserNoticeVariantMap
    : never = never,
>({
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
  allMessages,
}: ChatMessageType<TNoticeType, TVariant> & {
  onReply: (args: OnReply<TNoticeType>) => void;
  allMessages?: ChatMessageType<never>[];
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

  const emoteSheetRef = useRef<BottomSheetModal>(null);
  const badgeSheetRef = useRef<BottomSheetModal>(null);
  const actionSheetRef = useRef<BottomSheetModal>(null);

  const [selectedEmote, setSelectedEmote] = useState<ParsedPart | null>(null);
  const [selectedBadge, setSelectedBadge] = useState<SanitisedBadgeSet | null>(
    null,
  );

  const handleEmotePress = useCallback((part: ParsedPart) => {
    setSelectedEmote(part);
    emoteSheetRef.current?.present();
  }, []);

  const handleBadgePress = useCallback((badge: SanitisedBadgeSet) => {
    setSelectedBadge(badge);
    badgeSheetRef.current?.present();
  }, []);

  const messageText = useCallback(
    () => replaceEmotesWithText(message),
    [message],
  );

  const handleCopy = useCallback(() => {
    void Clipboard.setStringAsync(messageText()).then(() =>
      toast.success('Copied to clipboard'),
    );
    actionSheetRef.current?.dismiss();
  }, [messageText]);

  const renderMessagePart = useCallback(
    (part: ParsedPart, index: number) => {
      switch (part.type) {
        case 'text': {
          return (
            <Typography
              key={index}
              color="gray.text"
              style={styles.messageText}
            >
              {part.content}
            </Typography>
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

          let mentionColor: string | undefined;

          if (allMessages && mentionedUsername) {
            const mentionedUserMessage = [...allMessages]
              .reverse()
              .find(msg => {
                const msgUsername = msg.userstate.username?.toLowerCase();
                const msgLogin = msg.userstate.login?.toLowerCase();
                const msgSender = msg.sender?.toLowerCase();
                const searchUsername = mentionedUsername.toLowerCase();

                return (
                  msgUsername === searchUsername ||
                  msgLogin === searchUsername ||
                  msgSender === searchUsername
                );
              });

            if (mentionedUserMessage?.userstate.color) {
              mentionColor = mentionedUserMessage.userstate.color;
            } else {
              mentionColor = generateRandomTwitchColor(mentionedUsername);
            }
          } else if (mentionedUsername) {
            mentionColor = generateRandomTwitchColor(mentionedUsername);
          }

          const finalColor =
            mentionColor || generateRandomTwitchColor(mentionedUsername);

          return (
            <Typography key={`message-${index}`}>
              <Typography
                style={[
                  styles.mention,
                  styles.mentionDefaultColor,
                  finalColor && { color: lightenColor(finalColor) },
                ]}
              >
                {part.content}
              </Typography>
            </Typography>
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
    actionSheetRef.current?.present();
  }, []);

  const handleReply = useCallback(() => {
    onReply?.({
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
    });
    actionSheetRef.current?.dismiss();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onReply]);

  const isReply = Boolean(parentDisplayName);

  const isSystemNotice = message.some(
    part =>
      part.type === 'stv_emote_added' || part.type === 'stv_emote_removed',
  );

  return (
    <Button
      onLongPress={handleLongPress}
      style={[styles.chatContainer, style, isReply && styles.replyContainer]}
    >
      {isReply && (
        <View style={styles.replyIndicator}>
          <Icon icon="corner-down-left" size={16} />
          <Typography
            color="gray.accent"
            style={styles.replyToText}
            numberOfLines={1}
          >
            Replying to{' '}
            {parentColor ? (
              <Typography
                style={[
                  styles.replyToText,
                  styles.replyToDefaultColor,
                  parentColor && { color: lightenColor(parentColor) },
                ]}
              >
                {parentDisplayName}
              </Typography>
            ) : (
              <Typography color="gray.accent" style={styles.replyToText}>
                {parentDisplayName}
              </Typography>
            )}
            {replyBody && ` ${truncate(unescapeIrcTag(replyBody).trim(), 50)}`}
          </Typography>
        </View>
      )}

      {isSubscriptionNotice && (
        <View style={styles.subscriptionNoticeContainer}>
          {message.map(renderMessagePart)}
        </View>
      )}

      {!isSubscriptionNotice && (
        <View style={styles.messageLine}>
          {!isSystemNotice && (
            <Typography style={styles.timestamp}>
              {formatDate(new Date(), 'HH:mm')}:
            </Typography>
          )}
          {renderBadges()}
          {userstate.username && (
            <Typography
              style={[
                styles.username,
                styles.usernameDefaultColor,
                // eslint-disable next-line react-native/no-inline-styles
                userstate.color && { color: lightenColor(userstate.color) },
              ]}
            >
              {userstate.username}:
            </Typography>
          )}
          {message.map(renderMessagePart)}
        </View>
      )}

      {selectedEmote && selectedEmote.type === 'emote' && (
        <EmotePreviewSheet ref={emoteSheetRef} selectedEmote={selectedEmote} />
      )}

      {selectedBadge && (
        <BadgePreviewSheet ref={badgeSheetRef} selectedBadge={selectedBadge} />
      )}

      <ActionSheet
        message={message}
        ref={actionSheetRef}
        handleReply={handleReply}
        handleCopy={handleCopy}
      />
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
  },
) => React.JSX.Element;
const styles = StyleSheet.create(theme => ({
  chatContainer: {
    // backgroundColor: theme.colors.foregroundInverted,
  },
  messageLine: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    width: '100%',
    marginBottom: 5,
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
    width: '100%',
    marginBottom: 5,
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
    marginLeft: theme.spacing.md,
    borderCurve: 'continuous',
    borderLeftWidth: 2,
    paddingLeft: theme.spacing.sm,
  },
  replyIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  replyToTextContainer: {
    flex: 1,
    marginLeft: theme.spacing.xs,
  },
  replyToText: {
    marginLeft: theme.spacing.xs,
    opacity: 0.7,
    fontSize: theme.font.fontSize.xs,
  },
  replyToDefaultColor: {
    color: '#FFFFFF',
  },
  subscriptionNoticeContainer: {
    width: '100%',
  },
  messageText: {
    lineHeight: theme.spacing['2xl'],
  },
}));
