import { useCallback } from 'react';
import type { RefObject } from 'react';

import { impact, selection } from '@app/lib/haptics';
import {
  openChatBadgePreview,
  openChatEmotePreview,
  openChatEmoteSheet,
  openChatMessageActions,
  openChatSettingsSheet,
  openChatUserActions,
} from '@app/store/chat/actions/chatOverlays';
import { getMessageById } from '@app/store/chat/actions/messages';
import { fetchUserCosmetics } from '@app/store/chat/actions/userCosmeticsFetch';
import type { ChatMessageType } from '@app/store/chat/types/constants';
import { replaceEmotesWithText } from '@app/utils/chat/replaceEmotesWithText';

import type { ChatInputShellHandle } from '../components/ChatInputShell';
import type {
  BadgePressData,
  EmotePressData,
  MessageActionData,
  UsernamePressData,
} from '../components/ChatMessage/RichChatMessage.types';
import type { EmotePickerItem } from '../components/EmoteSheet/emoteSheetTypes';

export function useChatComposerActions({
  inputShellRef,
}: {
  inputShellRef: RefObject<ChatInputShellHandle | null>;
}) {
  const handleReply = useCallback(
    (message: ChatMessageType<'usernotice'>) => {
      const messageText = replaceEmotesWithText(message.message);
      const parentMessage = getMessageById(message.message_id);

      const twitchUserId = message.userstate['user-id'];
      if (twitchUserId) {
        void fetchUserCosmetics(twitchUserId);
      }

      inputShellRef.current?.setReplyTo({
        messageId: message.message_id,
        username: message.sender,
        message: messageText,
        messageParts: message.message,
        replyParentUserLogin: message.userstate.username || '',
        parentMessage: parentMessage
          ? replaceEmotesWithText(parentMessage.message)
          : '',
        color: message.userstate.color,
        userId: twitchUserId || undefined,
      });
    },
    [inputShellRef],
  );

  const handleEmoteSelect = useCallback(
    (item: EmotePickerItem) => {
      const emoteName = typeof item === 'string' ? item : item.name;
      inputShellRef.current?.appendEmote(emoteName);
    },
    [inputShellRef],
  );

  const appendMentionToComposer = useCallback(
    (username: string) => {
      inputShellRef.current?.appendMention(username);
    },
    [inputShellRef],
  );

  const insertPhraseToComposer = useCallback(
    (text: string) => {
      inputShellRef.current?.insertPhrase(text);
    },
    [inputShellRef],
  );

  return {
    appendMentionToComposer,
    handleEmoteSelect,
    handleReply,
    insertPhraseToComposer,
  };
}

/**
 * Press handlers that open an overlay. They call the overlay store directly
 * rather than taking openers from the overlay hook, so the chat root never
 * subscribes to which sheet is open.
 */
export function useChatOverlayActions(channelId: string) {
  const handleOpenEmoteSheet = useCallback(() => {
    openChatEmoteSheet(channelId);
  }, [channelId]);

  const handleOpenSettingsSheet = useCallback(() => {
    openChatSettingsSheet(channelId);
  }, [channelId]);

  const handleBadgeLongPress = useCallback(
    (badge: BadgePressData) => {
      selection();
      openChatBadgePreview(channelId, badge);
    },
    [channelId],
  );

  const handleMessageLongPress = useCallback(
    (data: MessageActionData<'usernotice'>) => {
      impact('light');
      openChatMessageActions(channelId, data);
    },
    [channelId],
  );

  const handleEmotePress = useCallback(
    (emote: EmotePressData) => {
      selection();
      openChatEmotePreview(channelId, emote);
    },
    [channelId],
  );

  const handleUsernamePress = useCallback(
    (usernameData: UsernamePressData) => {
      selection();
      openChatUserActions(channelId, usernameData);
    },
    [channelId],
  );

  return {
    handleBadgeLongPress,
    handleEmotePress,
    handleMessageLongPress,
    handleOpenEmoteSheet,
    handleOpenSettingsSheet,
    handleUsernamePress,
  };
}
