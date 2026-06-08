import { batch } from '@legendapp/state';
import { useCallback, useRef, type RefObject } from 'react';

import { parseIrcMessage } from '@app/services/recent-messages-service';
import {
  addMessage,
  clearMessages,
  getMessageById,
  getMessageColor,
  moderateMessageById,
  moderateMessagesByLogin,
  removeMessageById,
} from '@app/store/chat/actions/messages';
import { UserNoticeTags } from '@app/types/chat/irc-tags/usernotice';
import { generateRandomTwitchColor } from '@app/utils/chat/generateRandomTwitchColor';
import { logger } from '@app/utils/logger';

import { formatNoticeMessage } from '../util/formatNoticeMessage';
import {
  ingestChannelPointRewardTags,
  registerDeferredRewardgiftStandalone,
} from '@app/utils/chat/channelPointRewardTitleStore';
import {
  createBaseMessage,
  createSystemMessage,
  createUserNoticeMessage,
  createUserStateFromTags,
  coerceUserNoticeTags,
  type AnyChatMessageType,
} from '../util/messageHandlers';
import type { ChatListRef } from '../ChatMessagePane';
import {
  describeInitialRoomState,
  describeRoomStateChanges,
  parseRoomStateTags,
  SUPPRESSED_NOTICE_IDS,
  type ParsedRoomState,
} from '../util/roomState';

interface UseChatIrcHandlersOptions {
  channelId: string;
  channelName: string;
  clearLocalMessages: () => void;
  handleNewMessage: (
    message: AnyChatMessageType,
    options?: { countUnread?: boolean },
  ) => void;
  isMountedRef?: RefObject<boolean>;
  listRef: RefObject<ChatListRef | null>;
  isLoadingRecentMessagesRef?: RefObject<boolean>;
  messages$: { peek: () => AnyChatMessageType[] };
  moderateBufferedMessageById: (messageId: string, notice: string) => void;
  moderateBufferedMessagesByLogin: (login: string, notice: string) => void;
  processMessageEmotes: (
    text: string,
    userstate: ReturnType<typeof createUserStateFromTags>,
    baseMessage: AnyChatMessageType,
    userId?: string,
    countUnread?: boolean,
  ) => void;
  removeBufferedMessageById: (messageId: string) => void;
}

export function useChatIrcHandlers({
  channelId,
  channelName,
  clearLocalMessages,
  handleNewMessage,
  isMountedRef,
  isLoadingRecentMessagesRef,
  listRef,
  messages$,
  moderateBufferedMessageById,
  moderateBufferedMessagesByLogin,
  processMessageEmotes,
  removeBufferedMessageById,
}: UseChatIrcHandlersOptions) {
  const roomStateRef = useRef<ParsedRoomState | null>(null);

  const appendSystemMessage = useCallback(
    (content: string) => {
      addMessage(createSystemMessage(channelName, content));
    },
    [channelName],
  );

  const handlePrivmsgMessage = useCallback(
    (tags: Record<string, string>, text: string, countUnread = true) => {
      const userstate = createUserStateFromTags(tags);
      const replyParentMessageId = tags['reply-parent-msg-id'];
      const replyParentDisplayName = tags['reply-parent-display-name'];

      const userId = tags['user-id'];

      let parentColor: string | undefined;
      if (replyParentDisplayName?.trim()) {
        if (replyParentMessageId) {
          parentColor =
            getMessageColor(replyParentMessageId) ||
            generateRandomTwitchColor(replyParentDisplayName);
        } else {
          parentColor = generateRandomTwitchColor(replyParentDisplayName);
        }
      }

      const baseMessage = createBaseMessage({
        tags,
        channelName,
        text,
        broadcasterId: channelId,
      });
      const messageWithParentColor = { ...baseMessage, parentColor };

      processMessageEmotes(
        text,
        userstate,
        messageWithParentColor,
        userId,
        countUnread,
      );
    },
    [channelId, channelName, processMessageEmotes],
  );

  const onMessage = useCallback(
    (_channel: string, tags: Record<string, string>, text: string) => {
      handlePrivmsgMessage(tags, text);
    },
    [handlePrivmsgMessage],
  );

  const handleUserNoticeMessage = useCallback(
    (tags: UserNoticeTags, text: string, countUnread = true) => {
      if (tags['msg-id'] === 'rewardgift' && !text.trimEnd()) {
        ingestChannelPointRewardTags(tags, channelId);
        const login = tags.login;
        const rewardId = tags['custom-reward-id'];

        if (login && rewardId) {
          registerDeferredRewardgiftStandalone({
            login,
            rewardId,
            publish: () => {
              const redemptionNotice = createUserNoticeMessage({
                tags,
                channelName,
                text,
                broadcasterId: channelId,
              });
              handleNewMessage(redemptionNotice, { countUnread });
            },
          });
          return;
        }
      }

      const message = createUserNoticeMessage({
        tags,
        channelName,
        text,
        broadcasterId: channelId,
      });

      if (message.isAnnouncement || message.isHighlightedMessage) {
        const trimmedText = text.trimEnd();
        if (trimmedText) {
          processMessageEmotes(
            trimmedText,
            message.userstate,
            message,
            tags['user-id'],
            countUnread,
          );
          return;
        }
      }

      handleNewMessage(message, { countUnread });
    },
    [channelId, channelName, handleNewMessage, processMessageEmotes],
  );

  const onUserNotice = useCallback(
    (_channel: string, tags: UserNoticeTags, text: string) => {
      handleUserNoticeMessage(tags, text);
    },
    [handleUserNoticeMessage],
  );

  const onClearChat = useCallback(
    (
      _channel: string,
      tags: Record<string, string>,
      username?: string,
      banDuration?: number,
    ) => {
      const beforeCount = messages$.peek().length;
      logger.chat.warn('Twitch CLEARCHAT received', {
        channelId,
        channelName,
        username,
        banDuration,
        targetUserId: tags['target-user-id'],
        beforeCount,
      });

      const isFullChatClear = !username;
      if (!isFullChatClear && username) {
        const moderationNotice =
          banDuration != null
            ? `Timed out (${banDuration}s)`
            : 'Permanently banned';

        moderateBufferedMessagesByLogin(username, moderationNotice);
        moderateMessagesByLogin(username, moderationNotice);
        return;
      }

      clearLocalMessages();

      const systemMessageText = 'Chat was cleared by a moderator';

      const systemMessage = createSystemMessage(channelName, systemMessageText);

      batch(() => {
        clearMessages();
        addMessage(systemMessage);
      });
      setTimeout(() => {
        listRef.current?.scrollToEnd({ animated: false });
      }, 0);
    },
    [
      clearLocalMessages,
      channelId,
      channelName,
      listRef,
      messages$,
      moderateBufferedMessagesByLogin,
    ],
  );

  const onClearMessage = useCallback(
    (_channel: string, tags: Record<string, string>, targetMsgId: string) => {
      logger.chat.warn('Twitch CLEARMSG received', {
        channelId,
        channelName,
        login: tags.login,
        roomId: tags['room-id'],
        targetMsgId,
      });

      const moderationNotice = 'Deleted';
      moderateBufferedMessageById(targetMsgId, moderationNotice);
      const existingMessage = getMessageById(targetMsgId);

      if (existingMessage) {
        moderateMessageById(targetMsgId, moderationNotice);
        return;
      }

      removeBufferedMessageById(targetMsgId);
      removeMessageById(targetMsgId);
    },
    [
      channelId,
      channelName,
      moderateBufferedMessageById,
      removeBufferedMessageById,
    ],
  );

  const onJoin = useCallback(() => {
    logger.chat.info('Joined channel:', channelName);
    if (isLoadingRecentMessagesRef?.current || messages$.peek().length > 0) {
      return;
    }

    appendSystemMessage(`Connected to ${channelName}'s room`);
  }, [appendSystemMessage, channelName, isLoadingRecentMessagesRef, messages$]);

  const onPart = useCallback(() => {
    logger.chat.info('Parted from channel:', channelName);
    roomStateRef.current = null;
    if (isMountedRef?.current === false) {
      return;
    }

    clearMessages();
    clearLocalMessages();
  }, [channelName, clearLocalMessages, isMountedRef]);

  const onNotice = useCallback(
    (_channel: string, tags: Record<string, string>, messageText: string) => {
      const noticeId = tags['msg-id'];

      if (noticeId && SUPPRESSED_NOTICE_IDS.has(noticeId)) {
        return;
      }

      const formattedNotice = formatNoticeMessage(tags, messageText);
      if (!formattedNotice) {
        return;
      }

      appendSystemMessage(formattedNotice);
    },
    [appendSystemMessage],
  );

  const onRoomState = useCallback(
    (_channel: string, tags: Record<string, string>) => {
      const nextState = parseRoomStateTags(tags);
      const previousState = roomStateRef.current;
      roomStateRef.current = nextState;

      if (!previousState) {
        const initialDescription = describeInitialRoomState(nextState);
        if (initialDescription) {
          appendSystemMessage(initialDescription);
        }
        return;
      }

      const changes = describeRoomStateChanges(previousState, nextState);
      changes.forEach(change => {
        appendSystemMessage(change);
      });
    },
    [appendSystemMessage],
  );

  const onReconnect = useCallback(() => {
    appendSystemMessage('Reconnecting to Twitch chat…');
    roomStateRef.current = null;
  }, [appendSystemMessage]);

  const handleRecentIrcMessage = useCallback(
    async (line: string) => {
      const ircMessage = parseIrcMessage(line);
      if (!ircMessage?.tags) {
        return;
      }

      const { command, params, tags } = ircMessage;
      const channel = params[0];
      if (!channel) {
        return;
      }

      switch (command) {
        case 'PRIVMSG': {
          const text = params[1];
          if (text) {
            handlePrivmsgMessage(tags, text, false);
          }
          break;
        }
        case 'USERNOTICE': {
          const text = params[1] ?? '';
          handleUserNoticeMessage(coerceUserNoticeTags(tags), text, false);
          break;
        }
        case 'CLEARCHAT': {
          const username = params[1];
          const banDuration = tags['ban-duration']
            ? Number.parseInt(tags['ban-duration'], 10)
            : undefined;
          onClearChat(channel, tags, username, banDuration);
          break;
        }
        case 'CLEARMSG':
        case 'CLEARMESSAGE': {
          const targetMsgId = tags['target-msg-id'];
          if (targetMsgId) {
            onClearMessage(channel, tags, targetMsgId);
          }
          break;
        }
        case 'NOTICE': {
          const text = params[1];
          if (text) {
            onNotice(channel, tags, text);
          }
          break;
        }
        case 'ROOMSTATE': {
          onRoomState(channel, tags);
          break;
        }
      }
    },
    [
      handlePrivmsgMessage,
      handleUserNoticeMessage,
      onClearChat,
      onClearMessage,
      onNotice,
      onRoomState,
    ],
  );

  return {
    handleRecentIrcMessage,
    onClearChat,
    onClearMessage,
    onJoin,
    onMessage,
    onNotice,
    onPart,
    onReconnect,
    onRoomState,
    onUserNotice,
  };
}
