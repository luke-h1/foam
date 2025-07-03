/* eslint-disable camelcase */
import { SanitisedBadgeSet } from '@app/services';
import { ChatMessageType } from '@app/store/chatStore';
import { lightenColor, replaceEmotesWithText } from '@app/utils';
import { ParsedPart } from '@app/utils/chat/replaceTextWithEmotes';
import { formatDate } from '@app/utils/date-time';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import * as Clipboard from 'expo-clipboard';
import { useRef, useCallback, useMemo, memo, useState } from 'react';
import { View } from 'react-native';
import { createStyleSheet, useStyles } from 'react-native-unistyles';
import { Button } from '../../../Button';
import { Icon } from '../../../Icon';
import { Image } from '../../../Image';
import { ModalHandle } from '../../../ModalHandle';
import { Typography } from '../../../Typography';
import { EmoteBadgePreview } from '../EmoteBadgePreview';
import { MediaLinkCard } from '../MediaLinkCard';
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
    const bottomSheetModalRef = useRef<BottomSheetModal>(null);
    const messageActionsSheetRef = useRef<BottomSheetModal>(null);
    const snapPoints = useMemo(() => ['25%', '50%'], []);
    const messageActionSnapPoints = useMemo(() => ['25%'], []);
    const { theme } = useStyles();
    const [selectedEmote, setSelectedEmote] = useState<ParsedPart | null>(null);
    const [selectedBadge, setSelectedBadge] =
      useState<SanitisedBadgeSet | null>(null);

    const handleEmotePress = useCallback((part: ParsedPart) => {
      setSelectedEmote(part);
      setSelectedBadge(null);
      bottomSheetModalRef.current?.present();
    }, []);

    const handleBadgePress = useCallback((badge: SanitisedBadgeSet) => {
      setSelectedBadge(badge);
      setSelectedEmote(null);
      bottomSheetModalRef.current?.present();
    }, []);

    const handleSheetChanges = useCallback((index: number) => {
      if (index === -1) {
        setSelectedEmote(null);
        setSelectedBadge(null);
      }
    }, []);

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
      messageActionsSheetRef.current?.present();
    }, []);

    const handleCopy = useCallback(() => {
      const messageText = replaceEmotesWithText(message);
      void Clipboard.setStringAsync(messageText);
      messageActionsSheetRef.current?.dismiss();
    }, [message]);

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
      messageActionsSheetRef.current?.dismiss();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [onReply]);

    const isReply = Boolean(parentDisplayName);

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
          </Typography>{' '}
          {message.map(renderMessagePart)}
        </Typography>

        {/* Emote & Badge Preview Bottom Sheet */}
        <BottomSheetModal
          ref={bottomSheetModalRef}
          index={1}
          snapPoints={snapPoints}
          handleStyle={{ opacity: 0.95 }}
          backgroundStyle={styles.bottomSheet}
          handleComponent={ModalHandle}
          onChange={handleSheetChanges}
          enablePanDownToClose
          enableDismissOnClose
          enableContentPanningGesture
          enableHandlePanningGesture
        >
          <View style={styles.safeArea}>
            <EmoteBadgePreview
              selectedEmote={selectedEmote}
              selectedBadge={selectedBadge}
            />
          </View>
        </BottomSheetModal>

        <BottomSheetModal
          ref={messageActionsSheetRef}
          index={0}
          snapPoints={messageActionSnapPoints}
          handleStyle={{ opacity: 0.95 }}
          backgroundStyle={styles.bottomSheet}
          handleComponent={ModalHandle}
          enablePanDownToClose
          enableDismissOnClose
        >
          <View style={styles.messageActionsContainer}>
            <Button onPress={handleCopy} style={styles.messageActionButton}>
              <Icon icon="copy" size={20} color="#fff" />
              <Typography size="sm" style={styles.messageActionText}>
                Copy Message
              </Typography>
            </Button>
            <Button onPress={handleReply} style={styles.messageActionButton}>
              <Icon icon="corner-down-left" size={20} color="#fff" />
              <Typography size="sm" style={styles.messageActionText}>
                Reply
              </Typography>
            </Button>
          </View>
        </BottomSheetModal>
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
