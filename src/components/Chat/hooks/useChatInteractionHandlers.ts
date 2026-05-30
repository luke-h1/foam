import type { ChatMessageType } from '@app/store/chatStore/constants';
import { getMessageById } from '@app/store/chatStore/messages';
import { replaceEmotesWithText } from '@app/utils/chat/replaceEmotesWithText';
import type { ParsedPart } from '@app/utils/chat/replaceTextWithEmotes';
import { useCallback, type RefObject } from 'react';

import type { ChatInputShellHandle } from '../components/ChatInputShell';
import type {
  BadgePressData,
  EmotePressData,
  MessageActionData,
  UsernamePressData,
} from '../components/ChatMessage/RichChatMessage';
import type { EmotePickerItem } from '../components/EmoteSheet/EmoteSheet';
import type { ChatOverlayControllerHandle } from '../components/ChatOverlayController';

export function useChatInteractionHandlers({
  fetchUserCosmetics,
  inputShellRef,
  overlayControllerRef,
}: {
  fetchUserCosmetics: (twitchUserId: string) => Promise<void>;
  inputShellRef: RefObject<ChatInputShellHandle | null>;
  overlayControllerRef: RefObject<ChatOverlayControllerHandle | null>;
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
        parentMessage: replaceEmotesWithText(
          parentMessage?.message as ParsedPart[],
        ),
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
    overlayControllerRef.current?.openEmoteSheet();
  }, [overlayControllerRef]);

  const handleOpenSettingsSheet = useCallback(() => {
    overlayControllerRef.current?.openSettingsSheet();
  }, [overlayControllerRef]);

  const appendMentionToComposer = useCallback(
    (username: string) => {
      inputShellRef.current?.appendMention(username);
    },
    [inputShellRef],
  );

  const handleBadgeLongPress = useCallback(
    (badge: BadgePressData) => {
      overlayControllerRef.current?.openBadge(badge);
    },
    [overlayControllerRef],
  );

  const handleMessageLongPress = useCallback(
    (data: MessageActionData<'usernotice'>) => {
      overlayControllerRef.current?.openMessageActions(data);
    },
    [overlayControllerRef],
  );

  const handleEmotePress = useCallback(
    (emote: EmotePressData) => {
      overlayControllerRef.current?.openEmotePreview(emote);
    },
    [overlayControllerRef],
  );

  const handleUsernamePress = useCallback(
    (usernameData: UsernamePressData) => {
      overlayControllerRef.current?.openUserActions(usernameData);
    },
    [overlayControllerRef],
  );

  return {
    appendMentionToComposer,
    handleBadgeLongPress,
    handleEmotePress,
    handleEmoteSelect,
    handleMessageLongPress,
    handleOpenEmoteSheet,
    handleOpenSettingsSheet,
    handleReply,
    handleUsernamePress,
  };
}
