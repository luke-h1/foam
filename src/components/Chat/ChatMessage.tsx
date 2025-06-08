/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable camelcase */
import { ChatMessageType } from '@app/store/chatStore';
import { replaceEmotesWithText } from '@app/utils';
import { calculateAspectRatio } from '@app/utils/chat/calculateAspectRatio';
import { ParsedPart } from '@app/utils/chat/replaceTextWithEmotes';
import { formatDate } from '@app/utils/date-time';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import * as Clipboard from 'expo-clipboard';
import React, { useRef, useCallback, useMemo } from 'react';
import { View } from 'react-native';
import { createStyleSheet, useStyles } from 'react-native-unistyles';
import { Button } from '../Button';
import { Icon } from '../Icon';
import { Image } from '../Image';
import { ModalHandle } from '../ModalHandle';
import { Typography } from '../Typography';
import { EmotePreview } from './EmotePreview';
import { MediaLinkCard } from './MediaLinkCard';

type OnReply = Omit<ChatMessageType, 'style'>;

export const ChatMessage = React.memo(
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
    const [selectedEmote, setSelectedEmote] = React.useState<ParsedPart | null>(
      null,
    );

    const handleEmotePress = useCallback((part: ParsedPart) => {
      setSelectedEmote(part);
      bottomSheetModalRef.current?.present();
    }, []);

    const handleSheetChanges = useCallback((index: number) => {
      if (index === -1) {
        setSelectedEmote(null);
      }
    }, []);

    const renderMessagePart = useCallback(
      (part: ParsedPart, index: number) => {
        switch (part.type) {
          case 'text': {
            return (
              <Typography
                key={index}
                size="sm"
                color="text"
                style={styles.messageText}
              >
                {part.content}
              </Typography>
            );
          }

          case 'stvEmote': {
            return (
              <MediaLinkCard
                key={index}
                type="stvEmote"
                url={part.content ?? ''}
              />
            );
          }

          case 'twitchClip': {
            return (
              <MediaLinkCard
                key={index}
                type="twitchClip"
                url={part.content ?? ''}
              />
            );
          }

          case 'emote': {
            const { height, width } = calculateAspectRatio(
              part.width || 20,
              part.height || 20,
              30,
            );
            return (
              <Button key={index} onPress={() => handleEmotePress(part)}>
                <Image
                  source={part.url ?? ''}
                  transition={50}
                  style={{
                    width,
                    height,
                  }}
                />
              </Button>
            );
          }

          case 'mention': {
            return (
              <Typography key={index} size="sm">
                <Typography
                  size="sm"
                  style={[
                    styles.mention,
                    { color: userstate.color || '#FFFFFF' },
                  ]}
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
      [handleEmotePress, styles.messageText, styles.mention, userstate.color],
    );

    const renderBadges = useCallback(() => {
      return badges?.map(badge => (
        <Image
          key={`${badge.set}-${badge.id}`}
          source={badge.url}
          style={styles.badge}
          transition={20}
        />
      ));
    }, [badges, styles.badge]);

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

    return (
      <Button
        onLongPress={handleLongPress}
        style={[styles.chatContainer, style]}
      >
        <Typography style={styles.line} numberOfLines={0}>
          <Typography style={styles.timestamp} size="sm">
            {formatDate(new Date(), 'HH:mm')}:
          </Typography>
          {renderBadges()}
          <Typography
            size="sm"
            style={[styles.username, { color: userstate.color || '#FFFFFF' }]}
          >
            {userstate.username ?? ''}:
          </Typography>{' '}
          {message.map(renderMessagePart)}
        </Typography>

        {/* Emote Preview Bottom Sheet */}
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
            <EmotePreview selectedEmote={selectedEmote} />
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
              <Icon icon="copy" size={20} />
              <Typography size="sm" style={styles.messageActionText}>
                Copy Message
              </Typography>
            </Button>
            <Button onPress={handleReply} style={styles.messageActionButton}>
              <Icon icon="corner-down-left" size={20} />
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
}));
