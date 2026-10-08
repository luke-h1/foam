import type { RefObject } from 'react';

import type { ChatListRef } from '@app/components/chat/components/chat-list';
import { formatModerationSystemMessage } from '@app/components/chat/util/format-moderation-system-message/format-moderation-system-message';
import { formatNoticeMessage } from '@app/components/chat/util/format-notice-message';
import type {
  RoomStateTracker,
  RoomStateUpdate,
} from '@app/components/chat/util/room-state/room-state-tracker';
import { SUPPRESSED_NOTICE_IDS } from '@app/components/chat/util/room-state/suppressed-notice-ids';
import { resetChannelSession } from '@app/store/chat/actions/channel-session';
import {
  addMessage,
  clearMessagesWithNotice,
  getMessageColor,
} from '@app/store/chat/actions/messages';
import type { AnyChatMessageType } from '@app/store/chat/types/constants';
import { getPreferences } from '@app/store/preference-store';
import { UserNoticeTags } from '@app/types/chat/irc-tags/usernotice';
import {
  ingestChannelPointRewardTags,
  registerDeferredRewardgiftStandalone,
} from '@app/utils/chat/channel-point-reward-title-store';
import { reportUnrenderableNotice } from '@app/utils/chat/chat-health/report-unrenderable-notice';
import { generateRandomTwitchColor } from '@app/utils/chat/generate-random-twitch-color';
import { parseIrcMessage } from '@app/utils/chat/irc-protocol/parse-irc-message';
import {
  type IrcRouteHandlers,
  routeIrcMessage,
} from '@app/utils/chat/irc-protocol/route-irc-message';
import { coerceUserNoticeTags } from '@app/utils/chat/message-handlers/coerce-user-notice-tags';
import { createBaseMessage } from '@app/utils/chat/message-handlers/create-base-message';
import { createSystemMessage } from '@app/utils/chat/message-handlers/create-system-message';
import { createUserNoticeMessage } from '@app/utils/chat/message-handlers/create-user-notice-message';
import { createUserStateFromTags } from '@app/utils/chat/message-handlers/create-user-state-from-tags';
import { parseActionMessage } from '@app/utils/chat/parse-action-message/parse-action-message';
import { logger } from '@app/utils/logger';

const LIVE_FLAG = {};
const HISTORICAL_FLAG = { isHistorical: true as const };

const historicalFlag = (countUnread: boolean) =>
  countUnread ? LIVE_FLAG : HISTORICAL_FLAG;

export interface ChatIrcHandlerDeps {
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
  moderateChatMessageById: (messageId: string, notice: string) => void;
  moderateChatMessagesByLogin: (login: string, notice: string) => void;
  removeChatMessagesByLogin: (login: string) => void;
  enqueueLiveChatMessage: (
    baseMessage: AnyChatMessageType,
    countUnread?: boolean,
  ) => void;
  processMessageEmotes: (
    text: string,
    userstate: ReturnType<typeof createUserStateFromTags>,
    baseMessage: AnyChatMessageType,
    userId?: string,
    countUnread?: boolean,
  ) => void;
  removeChatMessageById: (messageId: string) => void;
  roomStateTracker: RoomStateTracker;
}

export function createChatIrcHandlers({
  channelId,
  channelName,
  clearLocalMessages,
  enqueueLiveChatMessage,
  handleNewMessage,
  isMountedRef,
  isLoadingRecentMessagesRef,
  listRef,
  messages$,
  moderateChatMessageById,
  moderateChatMessagesByLogin,
  processMessageEmotes,
  removeChatMessageById,
  removeChatMessagesByLogin,
  roomStateTracker,
}: ChatIrcHandlerDeps) {
  const appendSystemMessage = (content: string) => {
    addMessage(createSystemMessage(channelName, content));
  };

  const applyRoomStateUpdate = (update: RoomStateUpdate) => {
    update.notices.forEach(notice => {
      appendSystemMessage(notice);
    });
  };

  const handlePrivmsgMessage = (
    tags: Record<string, string>,
    rawText: string,
    countUnread = true,
  ) => {
    const { isAction, text } = parseActionMessage(rawText);
    const replyParentMessageId = tags['reply-parent-msg-id'];
    const replyParentDisplayName = tags['reply-parent-display-name'];

    // The parent's own colour is only known once its message is in the store;
    // otherwise fall back to the same hash Twitch uses for an unset colour.
    const parentColor = replyParentDisplayName?.trim()
      ? getMessageColor(replyParentMessageId ?? '') ||
        generateRandomTwitchColor(replyParentDisplayName)
      : undefined;

    const baseMessage = createBaseMessage({
      tags,
      channelName,
      text,
      broadcasterId: channelId,
      isAction,
    });

    const messageWithParentColor = {
      ...baseMessage,
      parentColor,
      ...historicalFlag(countUnread),
    };

    enqueueLiveChatMessage(messageWithParentColor, countUnread);
  };

  const onMessage = (
    _channel: string,
    tags: Record<string, string>,
    text: string,
  ) => {
    handlePrivmsgMessage(tags, text);
  };

  const handleUserNoticeMessage = (
    tags: UserNoticeTags,
    text: string,
    countUnread = true,
  ) => {
    const isBodylessRewardgift =
      tags['msg-id'] === 'rewardgift' && !text.trimEnd();

    if (isBodylessRewardgift) {
      ingestChannelPointRewardTags(tags, channelId);
    }

    const login = tags.login;
    const rewardId = tags['custom-reward-id'];

    // A bodyless rewardgift is the header of a redemption whose message has
    // not arrived yet, so hold it until the pair can publish together.
    if (isBodylessRewardgift && login && rewardId) {
      registerDeferredRewardgiftStandalone({
        login,
        rewardId,
        publish: () => {
          const redemptionNotice = {
            ...createUserNoticeMessage({
              tags,
              channelName,
              text,
              broadcasterId: channelId,
            }),
            ...historicalFlag(countUnread),
          };

          handleNewMessage(redemptionNotice, { countUnread });
        },
      });

      return;
    }

    const message = {
      ...createUserNoticeMessage({
        tags,
        channelName,
        text,
        broadcasterId: channelId,
      }),
      ...historicalFlag(countUnread),
    };

    if (message.message.length === 0) {
      reportUnrenderableNotice({
        msgId: tags['msg-id'],
        reason: 'no-body',
        stage: 'ingest',
        systemMsg: tags['system-msg'],
      });
      return;
    }

    const trimmedText = text.trimEnd();

    const needsEmoteProcessing =
      (message.isAnnouncement || message.isHighlightedMessage) &&
      Boolean(trimmedText);

    if (needsEmoteProcessing) {
      processMessageEmotes(
        trimmedText,
        message.userstate,
        message,
        tags['user-id'],
        countUnread,
      );

      return;
    }

    handleNewMessage(message, { countUnread });
  };

  const onUserNotice = (
    _channel: string,
    tags: UserNoticeTags,
    text: string,
  ) => {
    handleUserNoticeMessage(tags, text);
  };

  const onClearChat = (
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

    const { deletedMessageStyle, ignoreClearChat } = getPreferences();

    if (username && deletedMessageStyle === 'hidden') {
      appendSystemMessage(formatModerationSystemMessage(username, banDuration));
      removeChatMessagesByLogin(username);
      return;
    }

    if (username) {
      appendSystemMessage(formatModerationSystemMessage(username, banDuration));

      moderateChatMessagesByLogin(
        username,
        banDuration != null
          ? `Timed out (${banDuration}s)`
          : 'Permanently banned',
      );

      return;
    }

    /**
     * History replay comes through this same handler, so clearing here would
     * destroy the backfill the user is waiting on.
     */
    if (ignoreClearChat || isLoadingRecentMessagesRef?.current) {
      appendSystemMessage('A moderator cleared chat (history kept)');
      return;
    }

    clearLocalMessages();

    const systemMessageText = 'A moderator cleared chat';

    const systemMessage = createSystemMessage(channelName, systemMessageText);

    clearMessagesWithNotice(systemMessage);

    setTimeout(() => {
      listRef.current?.scrollToEnd({ animated: false });
    }, 0);
  };

  const onClearMessage = (
    _channel: string,
    tags: Record<string, string>,
    targetMsgId: string,
  ) => {
    logger.chat.warn('Twitch CLEARMSG received', {
      channelId,
      channelName,
      login: tags.login,
      roomId: tags['room-id'],
      targetMsgId,
    });

    if (getPreferences().deletedMessageStyle === 'hidden') {
      removeChatMessageById(targetMsgId);
      return;
    }

    moderateChatMessageById(targetMsgId, 'Deleted');
  };

  const onJoin = () => {
    logger.chat.info('Joined channel:', channelName);

    if (isLoadingRecentMessagesRef?.current || messages$.peek().length > 0) {
      return;
    }

    appendSystemMessage(`Connected to ${channelName}'s room`);
  };

  const onPart = (channel: string) => {
    /**
     * The shared socket can echo a stale PART for the previous room; only a
     * PART for this handler's own room may reset roomstate or clear messages.
     */
    const partedChannel = channel.replace(/^#/, '').toLowerCase();

    if (partedChannel !== channelName.toLowerCase()) {
      logger.chat.info(
        `Ignoring stale PART for ${channel} while in ${channelName}`,
      );
      return;
    }

    logger.chat.info('Parted from channel:', channelName);
    applyRoomStateUpdate(roomStateTracker.reset());

    if (isMountedRef?.current === false) {
      return;
    }

    resetChannelSession('token');
    clearLocalMessages();
  };

  const onUserJoin = (_channel: string, username: string) => {
    if (!getPreferences().showJoinPartMessages) {
      return;
    }
    appendSystemMessage(`${username} joined`);
  };

  const onUserPart = (_channel: string, username: string) => {
    if (!getPreferences().showJoinPartMessages) {
      return;
    }
    appendSystemMessage(`${username} parted`);
  };

  const onNotice = (
    _channel: string,
    tags: Record<string, string>,
    messageText: string,
  ) => {
    const noticeId = tags['msg-id'];

    if (noticeId && SUPPRESSED_NOTICE_IDS.has(noticeId)) {
      return;
    }

    const formattedNotice = formatNoticeMessage(tags, messageText);

    if (!formattedNotice) {
      return;
    }

    appendSystemMessage(formattedNotice);
  };

  const onRoomState = (_channel: string, tags: Record<string, string>) => {
    applyRoomStateUpdate(roomStateTracker.ingest(tags));
  };

  const onReconnect = () => {
    appendSystemMessage('Reconnecting to Twitch chat…');
    applyRoomStateUpdate(roomStateTracker.reset());
  };

  const replayRouteHandlers: IrcRouteHandlers = {
    privmsg: (_channel, tags, text) => {
      handlePrivmsgMessage(tags, text, false);
    },
    usernotice: (_channel, tags, text) => {
      handleUserNoticeMessage(coerceUserNoticeTags(tags), text, false);
    },
    clearchat: onClearChat,
    clearmsg: onClearMessage,
    notice: onNotice,
    roomstate: onRoomState,
  };

  const handleRecentIrcMessage = (line: string) => {
    const ircMessage = parseIrcMessage(line);

    if (!ircMessage?.tags) {
      return;
    }

    routeIrcMessage(ircMessage, replayRouteHandlers);
  };

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
    onUserJoin,
    onUserPart,
    onUserNotice,
  };
}
