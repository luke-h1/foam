/* eslint-disable camelcase */
import { SanitisedBadgeSet } from '@app/services';
import { ChatMessageType } from '@app/store/chatStore';
import { lightenColor, replaceEmotesWithText } from '@app/utils';
import { ParsedPart } from '@app/utils/chat/replaceTextWithEmotes';
import { formatDate } from '@app/utils/date-time';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import * as Clipboard from 'expo-clipboard';
import { useRef, useCallback, memo, useState } from 'react';
import { View } from 'react-native';
import { createStyleSheet, useStyles } from 'react-native-unistyles';
import { toast } from 'sonner-native';
import { Button } from '../../../Button';
import { Icon } from '../../../Icon';
import { Image } from '../../../Image';
import { Typography } from '../../../Typography';
import { ActionSheet } from '../ActionSheet';
import { BadgePreviewSheet } from '../BadgePreviewSheet';
import { EmotePreviewSheet } from '../EmotePreviewSheet';
import { MediaLinkCard } from '../MediaLinkCard';
import { UserSheet } from './UserSheet/UserSheet';
import { EmoteRenderer } from './renderers';

type OnReply = Omit<ChatMessageType, 'style'>;

export const ChatMessage = memo(
  ({
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
    onReply,
  }: ChatMessageType & { onReply: (args: OnReply) => void }) => {
    const { styles } = useStyles(stylesheet);
    const emoteSheetRef = useRef<BottomSheetModal>(null);
    const badgeSheetRef = useRef<BottomSheetModal>(null);
    const actionSheetRef = useRef<BottomSheetModal>(null);
    const userSheetRef = useRef<BottomSheetModal>(null);

    const { theme } = useStyles();

    const [selectedEmote, setSelectedEmote] = useState<ParsedPart | null>(null);
    const [selectedBadge, setSelectedBadge] =
      useState<SanitisedBadgeSet | null>(null);

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
          case 'text':
            return (
              <Typography size="sm" color="text">
                {part.content}
              </Typography>
            );

          case 'stvEmote':
            return <MediaLinkCard type="stvEmote" url={part.content} />;

          case 'twitchClip':
            return <MediaLinkCard type="twitchClip" url={part.content} />;

          case 'emote':
            return (
              <EmoteRenderer
                key={index}
                part={part as ParsedPart<'emote'>}
                handleEmotePress={handleEmotePress}
              />
            );

          case 'mention': {
            return (
              <Typography key={`message-${index}`} size="sm">
                <Typography
                  size="sm"
                  style={[styles.mention, { color: part.color ?? '#FFFFFF' }]}
                >
                  {part.content}
                </Typography>
              </Typography>
            );
          }

          default:
            return null;
        }
      },
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [userstate.username, userstate.color, handleEmotePress],
    );

    const renderBadges = useCallback(() => {
      return badges?.map(badge => (
        <Button
          key={`${badge.set}-${badge.id}`}
          onPress={() => handleBadgePress(badge)}
        >
          <Image source={badge.url} style={styles.badge} transition={20} />
        </Button>
      ));
    }, [badges, styles.badge, handleBadgePress]);

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

    const onUsernamePress = useCallback(() => {
      userSheetRef.current?.present();
    }, []);

    return (
      <Button
        onLongPress={handleLongPress}
        style={[styles.chatContainer, style, isReply && styles.replyContainer]}
      >
        {isReply && (
          <View style={styles.replyIndicator}>
            <Icon
              icon="corner-down-left"
              size={16}
              color={theme.colors.border}
            />
            <Typography size="xs" color="border" style={styles.replyToText}>
              Replying to {parentDisplayName}
            </Typography>
          </View>
        )}

        <Typography style={styles.line} numberOfLines={0}>
          <Typography style={styles.timestamp} size="sm">
            {formatDate(new Date(), 'HH:mm')}:
          </Typography>
          {renderBadges()}
          <Button onLongPress={onUsernamePress}>
            <Typography
              size="sm"
              style={[
                styles.username,
                {
                  color: userstate.color
                    ? lightenColor(userstate.color)
                    : '#FFFFFF',
                },
              ]}
            >
              {userstate.username ?? ''}:
            </Typography>
          </Button>{' '}
          {message.map(renderMessagePart)}
        </Typography>

        {selectedEmote && selectedEmote.type === 'emote' && (
          <EmotePreviewSheet
            ref={emoteSheetRef}
            selectedEmote={selectedEmote as ParsedPart<'emote'>}
          />
        )}

        {selectedBadge && (
          <BadgePreviewSheet
            ref={badgeSheetRef}
            selectedBadge={selectedBadge}
          />
        )}

        <ActionSheet
          ref={actionSheetRef}
          message={message}
          username={userstate.username}
          handleReply={handleReply}
          handleCopy={handleCopy}
        />
        <UserSheet ref={userSheetRef} userId={userstate['user-id']} />
      </Button>
    );
  },
);

ChatMessage.displayName = 'ChatMessage';

const stylesheet = createStyleSheet(theme => ({
  chatContainer: {
    backgroundColor: theme.colors.foregroundInverted,
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
  timestamp: {
    color: theme.colors.border,
    fontSize: theme.font.fontSize.xs,
    marginRight: 2,
  },
  messageText: {
    flexShrink: 1,
    flexWrap: 'wrap',
    minWidth: 0,
  },
  mention: {
    marginHorizontal: 2,
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
    backgroundColor: theme.colors.borderFaint,
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
    borderLeftWidth: 2,
    borderLeftColor: theme.colors.border,
    paddingLeft: theme.spacing.sm,
  },
  replyIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  replyToText: {
    marginLeft: theme.spacing.xs,
  },
}));
