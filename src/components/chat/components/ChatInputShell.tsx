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

import { getChatUserState } from '@app/components/chat/util/chat-user-state';
import { getCurrentEmoteData } from '@app/store/chat/actions/channel-load';
import { getMessageBadges } from '@app/store/chat/actions/shared-chat-badges/getMessageBadges';
import { getPreferences } from '@app/store/preference-store';
import type { AnyChatMessageType } from '@app/types/chat/chatMessage';
import type { UserInfoResponse } from '@app/types/twitch/user';
import { createOptimisticMessage } from '@app/utils/chat/message-handlers/createOptimisticMessage';
import { createOptimisticUserState } from '@app/utils/chat/message-handlers/createOptimisticUserState';
import { createUserStateFromTags } from '@app/utils/chat/message-handlers/createUserStateFromTags';
import { parseActionCommand } from '@app/utils/chat/parse-action-message/parseActionCommand';
import { logger } from '@app/utils/logger';

import { useChatImageUpload } from '../hooks/use-chat-image-upload';
import { parseModCommand } from '../util/mod-commands/parseModCommand';
import { runModCommand } from '../util/mod-commands/runModCommand';
import { findSlashCommandDefinition } from '../util/slash-command-definitions/findSlashCommandDefinition';
import { isRefreshCommand } from '../util/slash-command-definitions/isRefreshCommand';
import type { ChatComposerHandle } from './chat-composer/hooks/use-chat-composer-controller';
import { appendWithSpace } from './chat-composer/util/appendWithSpace';
import { formatReplyPrefix } from './chat-composer/util/formatReplyPrefix';
import { ChatInputSection } from './ChatInputSection';
import type { ReplyToData } from './ChatInputSection.types';

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
  ) => void;
  user?: UserInfoResponse;
  includeHorizontalSafeArea?: boolean;
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
  isChatConnected,
  onOpenEmoteSheet,
  onOpenSettingsSheet,
  onRefreshCommand,
  processMessageEmotes,
  sendMessage,
  user,
  includeHorizontalSafeArea = true,
  ref,
}: ChatInputShellProps) {
  const chatInputRef = useRef<ChatComposerHandle>(null);
  const { width, height } = useWindowDimensions();

  // A landscape phone leaves the composer too little room for the attach
  // button. The iPhone Duo inner display is also landscape (951x669) but has
  // room, so the test is a short window, not orientation. Landscape phones
  // top out near 440pt tall.
  const isShortLandscapeWindow = width > height && height < 500;
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
      writeComposerText(appendWithSpace(messageInputRef.current, url));
    },
    [writeComposerText],
  );

  const { isUploading: isUploadingImage, pickAndUpload } =
    useChatImageUpload(handleImageUploaded);

  const handleAttachImage = useCallback(() => {
    void pickAndUpload();
  }, [pickAndUpload]);

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

    // A known command with missing or invalid args parses to null. Show the
    // usage instead of sending it to IRC as plain chat text, where Twitch
    // answers with an "Unrecognized command" notice.
    const [commandName = ''] = currentInput.trim().startsWith('/')
      ? currentInput.trim().slice(1).split(/\s+/)
      : [];

    const definition = commandName
      ? findSlashCommandDefinition(commandName)
      : undefined;

    if (definition) {
      toast.error(
        `Usage: /${definition.name} ${definition.argHint ?? ''}`.trimEnd(),
      );
      return;
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

    // Twitch itself prepends `@<parent>` to a reply body for legacy client
    // compatibility, so the text we transmit must stay raw - prefixing it here
    // too broadcasts `@user @user ...`. The optimistic row keeps the prefix so
    // it matches the body Twitch echoes back.
    const transmittedText = currentInput;

    const messageText = replyTo
      ? `${formatReplyPrefix(replyTo.username)}${currentInput}`
      : actionBody;

    const optimisticUserstate = createOptimisticUserState({
      currentUserState: getChatUserState(),
      replyTo,
      user,
    });

    const emoteData = getCurrentEmoteData(channelId);

    const userBadges = getMessageBadges({
      emoteData,
      userstate: optimisticUserstate,
    });

    const optimisticMessage = createOptimisticMessage({
      badges: userBadges,
      channelName,
      isAction,
      messageText,
      replyTo,
      sentAt: Date.now(),
      timestampFormat: getPreferences().chatTimestampFormat,
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
        sendMessage(channelName, transmittedText, replyTo.messageId);
      } catch (error) {
        logger.chat.error('issue sending reply', error);
      }
    } else {
      sendMessage(channelName, transmittedText);
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

        writeComposerText(appendWithSpace(messageInputRef.current, emoteName));
      },
      appendMention: (username: string) => {
        if (!isAuthenticated) {
          return;
        }

        writeComposerText(
          appendWithSpace(messageInputRef.current, `@${username}`),
        );

        chatInputRef.current?.focus();
      },
      insertPhrase: (text: string) => {
        if (!isAuthenticated) {
          return;
        }

        writeComposerText(appendWithSpace(messageInputRef.current, text));
        chatInputRef.current?.focus();
      },
      clearReply: handleClearReply,
      setReplyTo: nextReplyTo => {
        if (!isAuthenticated) {
          return;
        }

        setDraft(prev => ({ ...prev, replyTo: nextReplyTo }));
      },
    }),
    [handleClearReply, isAuthenticated, writeComposerText],
  );

  return (
    <ChatInputSection
      {...{
        isAuthenticated,
        messageInput,
        onChangeText: handleComposerTextChange,
        onSubmit: handleSendMessage,
        onOpenEmoteSheet,
        onOpenSettingsSheet,
        onAttachImage:
          isAuthenticated && !isShortLandscapeWindow
            ? handleAttachImage
            : undefined,
        isUploadingImage,
        replyTo,
        onClearReply: handleClearReply,
        inputRef: chatInputRef,
        includeHorizontalSafeArea,
      }}
    />
  );
});
