import {
  memo,
  type Ref,
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { useWindowDimensions } from 'react-native';
import { KeyboardController } from 'react-native-keyboard-controller';

import { toast } from 'sonner-native';

import { getChatUserState } from '@app/services/twitch-chat-service';
import { getCurrentEmoteData } from '@app/store/chat/actions/channelLoad';
import { getUserBadge } from '@app/store/chat/actions/cosmetics';
import type { AnyChatMessageType } from '@app/store/chat/types/constants';
import type { UserInfoResponse } from '@app/types/twitch/user';
import { findBadges } from '@app/utils/chat/findBadges';
import { createOptimisticMessage } from '@app/utils/chat/messageHandlers/createOptimisticMessage';
import { createOptimisticUserState } from '@app/utils/chat/messageHandlers/createOptimisticUserState';
import { createUserStateFromTags } from '@app/utils/chat/messageHandlers/createUserStateFromTags';
import { parseActionCommand } from '@app/utils/chat/parseActionMessage/parseActionCommand';
import { logger } from '@app/utils/logger';

import { useChatImageUpload } from '../hooks/useChatImageUpload';
import { parseModCommand } from '../util/modCommands/parseModCommand';
import { runModCommand } from '../util/modCommands/runModCommand';
import { findSlashCommandDefinition } from '../util/slashCommandDefinitions/findSlashCommandDefinition';
import { isRefreshCommand } from '../util/slashCommandDefinitions/isRefreshCommand';
import type { ChatComposerHandle } from './ChatComposer/ChatComposer';
import { ChatInputSection, type ReplyToData } from './ChatInputSection';

export interface ChatInputShellHandle {
  appendEmote: (emoteName: string) => void;
  appendMention: (username: string) => void;
  insertPhrase: (text: string) => void;
  clearReply: () => void;
  setReplyTo: (replyTo: ReplyToData | null) => void;
}

interface ChatInputShellProps {
  channelId: string;
  channelName: string;
  connected: boolean;
  isChatConnected: () => boolean;
  onOpenEmoteSheet: () => void;
  onOpenSettingsSheet: () => void;
  onRefreshCommand: () => void;
  processMessageEmotes: (
    text: string,
    userstate: ReturnType<typeof createUserStateFromTags>,
    baseMessage: AnyChatMessageType,
    userId?: string,
    countUnread?: boolean,
  ) => void | Promise<void>;
  sendMessage: (
    channel: string,
    message: string,
    replyParentMsgId?: string,
    replyParentDisplayName?: string,
    replyParentMsgBody?: string,
  ) => void;
  user?: UserInfoResponse;
  ref?: Ref<ChatInputShellHandle>;
}

interface ChatDraftState {
  messageInput: string;
  replyTo: ReplyToData | null;
}

const createEmptyDraft = (): ChatDraftState => ({
  messageInput: '',
  replyTo: null,
});

export const ChatInputShell = memo(function ChatInputShell({
  channelId,
  channelName,
  connected,
  isChatConnected,
  onOpenEmoteSheet,
  onOpenSettingsSheet,
  onRefreshCommand,
  processMessageEmotes,
  sendMessage,
  user,
  ref,
}: ChatInputShellProps) {
  const chatInputRef = useRef<ChatComposerHandle>(null);
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const [draft, setDraft] = useState<ChatDraftState>(createEmptyDraft);
  const { messageInput, replyTo } = draft;
  const messageInputRef = useRef(messageInput);
  const isAuthenticated = Boolean(user?.id && user.login);
  const clearDraft = useCallback(() => {
    messageInputRef.current = '';
    chatInputRef.current?.setText('');
    setDraft(createEmptyDraft());
  }, []);

  const handleComposerTextChange = useCallback((text: string) => {
    messageInputRef.current = text;
    setDraft(prev => ({ ...prev, messageInput: text }));
  }, []);

  const writeComposerText = useCallback((next: string) => {
    messageInputRef.current = next;
    chatInputRef.current?.setText(next);
  }, []);

  const handleImageUploaded = useCallback(
    (url: string) => {
      const current = messageInputRef.current;
      const needsSpace = current.length > 0 && !current.endsWith(' ');
      writeComposerText(`${current}${needsSpace ? ' ' : ''}${url} `);
    },
    [writeComposerText],
  );

  const { isUploading: isUploadingImage, pickAndUpload } =
    useChatImageUpload(handleImageUploaded);

  const handleAttachImage = useCallback(() => {
    if (!isAuthenticated) {
      return;
    }
    void pickAndUpload();
  }, [isAuthenticated, pickAndUpload]);

  const handleClearReply = useCallback(() => {
    setDraft(prev => ({ ...prev, replyTo: null }));
  }, []);

  const handleSendMessage = useCallback(() => {
    const currentInput = messageInputRef.current;
    if (!currentInput.trim()) {
      return;
    }

    if (isRefreshCommand(currentInput)) {
      onRefreshCommand();
      clearDraft();
      void KeyboardController.dismiss();
      return;
    }

    if (!isAuthenticated) {
      logger.chat.warn('Cannot send chat message while signed out');
      return;
    }

    // Twitch dropped slash commands from IRC in 2023; known moderation
    // commands run against Helix instead of going out as chat text.
    const modCommand = parseModCommand(currentInput);
    if (modCommand) {
      clearDraft();
      void KeyboardController.dismiss();
      runModCommand(modCommand, channelId, user?.id);
      return;
    }

    // A known command with missing/invalid args parses to null; surface the
    // usage instead of letting it fall through to IRC as plain chat text,
    // where Twitch answers with an "Unrecognized command" notice.
    if (currentInput.trim().startsWith('/')) {
      const [commandName = ''] = currentInput.trim().slice(1).split(/\s+/);
      const definition = findSlashCommandDefinition(commandName);
      if (definition) {
        toast.error(
          `Usage: /${definition.name} ${definition.argHint ?? ''}`.trimEnd(),
        );
        return;
      }
    }

    if (!isChatConnected()) {
      logger.chat.warn('Sending chat message while IRC join state is stale');
    }

    const { isAction, text: actionBody } = replyTo
      ? { isAction: false, text: currentInput }
      : parseActionCommand(currentInput);

    if (isAction && !actionBody.trim()) {
      return;
    }

    const sentText = replyTo
      ? `@${replyTo.username} ${currentInput}`
      : currentInput;
    const messageText = replyTo
      ? `@${replyTo.username} ${currentInput}`
      : actionBody;

    const optimisticUserstate = createOptimisticUserState({
      currentUserState: getChatUserState(),
      replyTo,
      user,
    });

    const emoteData = getCurrentEmoteData(channelId);
    const userBadges = findBadges({
      userstate: optimisticUserstate,
      bttvBadges: emoteData.bttvBadges,
      chatterinoBadges: emoteData.chatterinoBadges,
      ffzChannelBadges: emoteData.ffzChannelBadges,
      ffzGlobalBadges: emoteData.ffzGlobalBadges,
      twitchChannelBadges: emoteData.twitchChannelBadges,
      twitchGlobalBadges: emoteData.twitchGlobalBadges,
      getEntitledBadge: getUserBadge,
    });

    const optimisticMessage = createOptimisticMessage({
      badges: userBadges,
      channelName,
      isAction,
      messageText,
      replyTo,
      sentAt: Date.now(),
      user,
      userstate: optimisticUserstate,
    });

    void processMessageEmotes(
      messageText,
      optimisticUserstate,
      optimisticMessage,
      undefined,
      false,
    );

    if (replyTo) {
      try {
        sendMessage(
          channelName,
          sentText,
          replyTo.messageId,
          replyTo.username,
          replyTo.message,
        );
      } catch (error) {
        logger.chat.error('issue sending reply', error);
      }
    } else {
      sendMessage(channelName, sentText);
    }

    clearDraft();
    void KeyboardController.dismiss();
  }, [
    channelId,
    channelName,
    clearDraft,
    isChatConnected,
    isAuthenticated,
    onRefreshCommand,
    processMessageEmotes,
    replyTo,
    sendMessage,
    user,
  ]);

  useImperativeHandle(
    ref,
    () => ({
      appendEmote: (emoteName: string) => {
        if (!isAuthenticated) {
          return;
        }
        const current = messageInputRef.current;
        writeComposerText(
          `${current}${current.length > 0 ? ' ' : ''}${emoteName} `,
        );
      },
      appendMention: (username: string) => {
        if (!isAuthenticated) {
          return;
        }
        const current = messageInputRef.current;
        const next = !current.trim()
          ? `@${username} `
          : `${current}${current.endsWith(' ') ? '' : ' '}@${username} `;
        writeComposerText(next);
        chatInputRef.current?.focus();
      },
      insertPhrase: (text: string) => {
        if (!isAuthenticated) {
          return;
        }
        const current = messageInputRef.current;
        const needsSpace = current.length > 0 && !current.endsWith(' ');
        writeComposerText(`${current}${needsSpace ? ' ' : ''}${text} `);
        chatInputRef.current?.focus();
      },
      clearReply: () => {
        setDraft(prev => ({ ...prev, replyTo: null }));
      },
      setReplyTo: nextReplyTo => {
        if (!isAuthenticated) {
          return;
        }
        setDraft(prev => ({ ...prev, replyTo: nextReplyTo }));
      },
    }),
    [isAuthenticated, writeComposerText],
  );

  return (
    <ChatInputSection
      messageInput={messageInput}
      onChangeText={handleComposerTextChange}
      onSubmit={handleSendMessage}
      onOpenEmoteSheet={onOpenEmoteSheet}
      onOpenSettingsSheet={onOpenSettingsSheet}
      onAttachImage={isLandscape ? undefined : handleAttachImage}
      isUploadingImage={isUploadingImage}
      replyTo={replyTo}
      onClearReply={handleClearReply}
      connection={{
        isAuthenticated,
        isConnected: connected,
        isSending: false,
      }}
      inputRef={chatInputRef}
    />
  );
});
