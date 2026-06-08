import type { ChatComposerHandle } from './ChatComposer/ChatComposer';
import type { useAuthContext } from '@app/context/AuthContext';
import { twitchService } from '@app/services/twitch-service';
import { getCurrentEmoteData } from '@app/store/chat/actions/channelLoad';
import type { SanitisedEmote } from '@app/types/emote';
import { formatDate } from '@app/utils/date-time/date';
import { findBadges } from '@app/utils/chat/findBadges';
import { generateRandomTwitchColor } from '@app/utils/chat/generateRandomTwitchColor';
import { parseBadges } from '@app/utils/chat/parseBadges';
import { logger } from '@app/utils/logger';
import {
  memo,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type Ref,
} from 'react';
import { KeyboardController } from 'react-native-keyboard-controller';
import { toast } from 'sonner-native';

import { ChatInputSection, type ReplyToData } from './ChatInputSection';
import type { PinnedChatMessageViewModel } from '../hooks/usePinnedChatMessage';
import {
  createUserStateFromTags,
  type AnyChatMessageType,
} from '../util/messageHandlers';

export interface ChatInputShellHandle {
  appendEmote: (emoteName: string) => void;
  appendMention: (username: string) => void;
  clearReply: () => void;
  setReplyTo: (replyTo: ReplyToData | null) => void;
}

interface ChatInputShellProps {
  canPinNextMessage: boolean;
  channelId: string;
  channelName: string;
  connected: boolean;
  getUserState: () => Record<string, string>;
  isChatConnected: () => boolean;
  onOpenEmoteSheet: () => void;
  onOpenSettingsSheet: () => void;
  onPinnedMessageChanged: (message: PinnedChatMessageViewModel) => void;
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
  user: ReturnType<typeof useAuthContext>['user'];
  ref?: Ref<ChatInputShellHandle>;
}

interface ChatDraftState {
  messageInput: string;
  pinNextMessage: boolean;
  replyTo: ReplyToData | null;
}

const createEmptyDraft = (): ChatDraftState => ({
  messageInput: '',
  pinNextMessage: false,
  replyTo: null,
});

export const ChatInputShell = memo(function ChatInputShell({
  canPinNextMessage,
  channelId,
  channelName,
  connected,
  getUserState,
  isChatConnected,
  onOpenEmoteSheet,
  onOpenSettingsSheet,
  onPinnedMessageChanged,
  processMessageEmotes,
  sendMessage,
  user,
  ref,
}: ChatInputShellProps) {
  const chatInputRef = useRef<ChatComposerHandle>(null);
  const [draft, setDraft] = useState<ChatDraftState>(createEmptyDraft);
  const [isSendingPinnedMessage, setIsSendingPinnedMessage] = useState(false);
  const { messageInput, pinNextMessage, replyTo } = draft;
  const isAuthenticated = Boolean(user?.id && user?.login);
  const canPinCurrentMessage =
    canPinNextMessage && !replyTo && !isSendingPinnedMessage;
  const isPinNextMessageSelected = canPinCurrentMessage && pinNextMessage;

  const clearDraft = useCallback(() => {
    chatInputRef.current?.setText('');
    setDraft(createEmptyDraft());
  }, []);

  const handleComposerTextChange = useCallback(
    (text: string) => {
      if (!isAuthenticated) {
        return;
      }
      setDraft(prev => ({ ...prev, messageInput: text }));
    },
    [isAuthenticated],
  );

  const handleComposerEmoteSelect = useCallback(
    (emote: SanitisedEmote) => {
      if (!isAuthenticated) {
        return;
      }
      setDraft(prev => {
        const next = `${prev.messageInput}${prev.messageInput.length > 0 ? ' ' : ''}${emote.name} `;
        chatInputRef.current?.setText(next);
        return { ...prev, messageInput: next };
      });
    },
    [isAuthenticated],
  );

  const handleClearReply = useCallback(() => {
    setDraft(prev => ({ ...prev, replyTo: null }));
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      clearDraft();
    }
  }, [clearDraft, isAuthenticated]);

  const handleTogglePinNextMessage = useCallback(() => {
    if (!canPinCurrentMessage) {
      return;
    }

    setDraft(prev => ({ ...prev, pinNextMessage: !prev.pinNextMessage }));
  }, [canPinCurrentMessage]);

  const handleSendMessage = useCallback(async () => {
    if (!messageInput.trim()) {
      return;
    }
    if (!isAuthenticated) {
      logger.chat.warn('Cannot send chat message while signed out');
      return;
    }

    if (!isChatConnected()) {
      logger.chat.warn('Sending chat message while IRC join state is stale');
    }

    const messageText = replyTo
      ? `@${replyTo.username} ${messageInput}`
      : messageInput;
    const shouldPinMessage = isPinNextMessageSelected;
    const currentUserState = getUserState();
    const badgeData = parseBadges(currentUserState.badges || '');

    const optimisticUserstate = {
      ...currentUserState,
      'display-name':
        user?.display_name || currentUserState['display-name'] || '',
      login: user?.login || currentUserState.login || '',
      username:
        user?.display_name ||
        user?.login ||
        currentUserState['display-name'] ||
        '',
      'user-id': user?.id || currentUserState['user-id'] || '',
      'badges-raw': badgeData['badges-raw'],
      badges: badgeData.badges,
      color:
        currentUserState.color ||
        (user?.login ? generateRandomTwitchColor(user.login) : undefined),
      'reply-parent-msg-id': replyTo?.messageId || '',
      'reply-parent-msg-body': replyTo?.message || '',
      'reply-parent-display-name': replyTo?.username || '',
      'reply-parent-user-login': replyTo?.replyParentUserLogin || '',
    };

    const emoteData = getCurrentEmoteData(channelId);
    const senderName = user?.display_name || user?.login || '';

    const userBadges = emoteData
      ? findBadges({
          userstate: optimisticUserstate,
          chatterinoBadges: emoteData.chatterinoBadges,
          chatUsers: [],
          ffzChannelBadges: emoteData.ffzChannelBadges,
          ffzGlobalBadges: emoteData.ffzGlobalBadges,
          twitchChannelBadges: emoteData.twitchChannelBadges,
          twitchGlobalBadges: emoteData.twitchGlobalBadges,
        })
      : [];

    let optimisticMessageId = `${Date.now()}`;
    if (shouldPinMessage) {
      setIsSendingPinnedMessage(true);
      try {
        const sendResult = await twitchService.sendChatMessage({
          broadcasterId: channelId,
          message: messageText,
          pin: true,
          senderId: user?.id ?? '',
        });
        optimisticMessageId = sendResult?.message_id || optimisticMessageId;
      } catch (error) {
        logger.chat.error('issue sending pinned message', error);
        toast.error('Could not send pinned message');
        setIsSendingPinnedMessage(false);
        return;
      }
    }

    const optimisticMessage: AnyChatMessageType = {
      id: `${optimisticMessageId}_${optimisticMessageId}`,
      userstate: optimisticUserstate,
      message: [{ type: 'text', content: messageText.trimEnd() }],
      badges: userBadges,
      channel: channelName,
      message_id: optimisticMessageId,
      message_nonce: optimisticMessageId,
      timestamp: formatDate(Date.now(), 'HH:mm'),
      sender: senderName,
      parentDisplayName: replyTo?.username || '',
      replyDisplayName: replyTo?.replyParentUserLogin || '',
      replyBody: replyTo?.message || '',
      parentColor: replyTo?.color,
    };

    void processMessageEmotes(
      messageText,
      optimisticUserstate,
      optimisticMessage,
      undefined,
      false,
    );

    if (shouldPinMessage) {
      onPinnedMessageChanged({
        messageId: optimisticMessage.message_id,
        senderName,
        text: messageText.trimEnd(),
      });
      toast.success('Message pinned');
      setIsSendingPinnedMessage(false);
    } else if (replyTo) {
      try {
        sendMessage(
          channelName,
          messageText,
          replyTo.messageId,
          replyTo.username,
          replyTo.message,
        );
      } catch (error) {
        logger.chat.error('issue sending reply', error);
      }
    } else {
      sendMessage(channelName, messageText);
    }

    clearDraft();
    void KeyboardController.dismiss();
  }, [
    channelId,
    channelName,
    clearDraft,
    getUserState,
    isChatConnected,
    isAuthenticated,
    isPinNextMessageSelected,
    messageInput,
    onPinnedMessageChanged,
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
        setDraft(prev => {
          const next = `${prev.messageInput}${prev.messageInput.length > 0 ? ' ' : ''}${emoteName} `;
          chatInputRef.current?.setText(next);
          return { ...prev, messageInput: next };
        });
      },
      appendMention: (username: string) => {
        if (!isAuthenticated) {
          return;
        }
        setDraft(prev => {
          const trimmed = prev.messageInput.trim();
          const next = !trimmed
            ? `@${username} `
            : `${prev.messageInput}${prev.messageInput.endsWith(' ') ? '' : ' '}@${username} `;
          chatInputRef.current?.setText(next);
          return { ...prev, messageInput: next };
        });
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
    [isAuthenticated],
  );

  return (
    <ChatInputSection
      messageInput={messageInput}
      onChangeText={handleComposerTextChange}
      onEmoteSelect={handleComposerEmoteSelect}
      onSubmit={handleSendMessage}
      onOpenEmoteSheet={onOpenEmoteSheet}
      onOpenSettingsSheet={onOpenSettingsSheet}
      replyTo={replyTo}
      onClearReply={handleClearReply}
      connection={{
        isAuthenticated,
        isConnected: connected,
        isSending: isSendingPinnedMessage,
      }}
      pin={{
        canPinNextMessage: canPinCurrentMessage,
        onTogglePinNextMessage: handleTogglePinNextMessage,
        pinNextMessage: isPinNextMessageSelected,
      }}
      inputRef={chatInputRef}
    />
  );
});
