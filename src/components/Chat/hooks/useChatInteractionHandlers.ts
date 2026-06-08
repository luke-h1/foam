import { useCallback } from 'react';
import type { RefObject } from 'react';
import type { ChatMessageType } from '@app/store/chat/types/constants';
import { getMessageById } from '@app/store/chat/actions/messages';
import { replaceEmotesWithText } from '@app/utils/chat/replaceEmotesWithText';
import type { ChatInputShellHandle } from '../ChatInputShell';
import type {
  EmotePressData,
  MessageActionData,
  UsernamePressData,
} from '../ChatMessage/RichChatMessage';
import type { ChatOverlaysHandle } from '../ChatOverlays';
import { EmotePickerItem } from '../EmoteSheet/components/EmoteCell';

export function useChatInteractionHandlers({
  fetchUserCosmetics,
  inputShellRef,
  chatOverlaysRef,
}: {
  fetchUserCosmetics: (twitchUserId: string) => Promise<void>;
  inputShellRef: RefObject<ChatInputShellHandle | null>;
  chatOverlaysRef: RefObject<ChatOverlaysHandle | null>;
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

  const handleOpenEmoteSheet = useCallback(() => {
    chatOverlaysRef.current?.openEmoteSheet();
  }, [chatOverlaysRef]);

  const handleOpenSettingsSheet = useCallback(() => {
    chatOverlaysRef.current?.openSettingsSheet();
  }, [chatOverlaysRef]);

  const appendMentionToComposer = useCallback(
    (username: string) => {
      inputShellRef.current?.appendMention(username);
    },
    [inputShellRef],
  );

  const prepareTimeoutCommand = useCallback(
    (login: string) => {
      inputShellRef.current?.prepareTimeoutCommand(login);
    },
    [inputShellRef],
  );

  const handleMessageLongPress = useCallback(
    (data: MessageActionData<'usernotice'>) => {
      chatOverlaysRef.current?.openMessageActions(data);
    },
    [chatOverlaysRef],
  );

  const handleEmotePress = useCallback(
    (emote: EmotePressData) => {
      chatOverlaysRef.current?.openEmotePreview(emote);
    },
    [chatOverlaysRef],
  );

  const handleUsernamePress = useCallback(
    (usernameData: UsernamePressData) => {
      chatOverlaysRef.current?.openUserActions(usernameData);
    },
    [chatOverlaysRef],
  );

  return {
    appendMentionToComposer,
    prepareTimeoutCommand,
    handleEmotePress,
    handleEmoteSelect,
    handleMessageLongPress,
    handleOpenEmoteSheet,
    handleOpenSettingsSheet,
    handleReply,
    handleUsernamePress,
  };
}
