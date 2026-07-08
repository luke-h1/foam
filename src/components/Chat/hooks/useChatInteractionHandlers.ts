import { useCallback } from 'react';
import type { RefObject } from 'react';

import { impact, selection } from '@app/lib/haptics';
import { getMessageById } from '@app/store/chat/actions/messages';
import type { ChatMessageType } from '@app/store/chat/types/constants';
import { replaceEmotesWithText } from '@app/utils/chat/replaceEmotesWithText';

import type { ChatInputShellHandle } from '../components/ChatInputShell';
import type {
  BadgePressData,
  EmotePressData,
  MessageActionData,
  UsernamePressData,
} from '../components/ChatMessage/RichChatMessage.types';
import type { EmotePickerItem } from '../components/EmoteSheet/EmoteSheet';
import type { ChatOverlayOpeners } from '../components/useChatOverlays';

export function useChatComposerActions({
  fetchUserCosmetics,
  inputShellRef,
}: {
  fetchUserCosmetics: (twitchUserId: string, login: string) => Promise<void>;
  inputShellRef: RefObject<ChatInputShellHandle | null>;
}) {
  const handleReply = useCallback(
    (message: ChatMessageType<'usernotice'>) => {
      const messageText = replaceEmotesWithText(message.message);
      const parentMessage = getMessageById(message.message_id);

      const twitchUserId = message.userstate['user-id'];
      if (twitchUserId) {
        void fetchUserCosmetics(twitchUserId, message.userstate.username || '');
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
    [fetchUserCosmetics, inputShellRef],
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

export function useChatOverlayActions(openers: ChatOverlayOpeners) {
  const handleOpenEmoteSheet = useCallback(() => {
    openers.openEmoteSheet();
  }, [openers]);

  const handleOpenSettingsSheet = useCallback(() => {
    openers.openSettingsSheet();
  }, [openers]);

  const handleBadgeLongPress = useCallback(
    (badge: BadgePressData) => {
      void selection();
      openers.openBadge(badge);
    },
    [openers],
  );

  const handleMessageLongPress = useCallback(
    (data: MessageActionData<'usernotice'>) => {
      void impact('light');
      openers.openMessageActions(data);
    },
    [openers],
  );

  const handleEmotePress = useCallback(
    (emote: EmotePressData) => {
      void selection();
      openers.openEmotePreview(emote);
    },
    [openers],
  );

  const handleUsernamePress = useCallback(
    (usernameData: UsernamePressData) => {
      void selection();
      openers.openUserActions(usernameData);
    },
    [openers],
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
